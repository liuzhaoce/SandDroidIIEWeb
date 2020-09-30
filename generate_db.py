#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Generate database data from original files

from models import *
from config import *

import os, json,traceback

THREAT = {'normal': 2,
          'signature': 7,
          'signatureOrSystem': 8,
          'dangerous': 9}

report_dir = r'E:\03-SandDroid\sanddroid\SandDroidReports'

APP_TYPES = ['map', 'safety', 'video', 'audio', 'office']
MAL_TYPES = ['trojan', 'information stealer', 'phishing']


dataModel = DataModel(DATABASE_USER, DATABASE_PSWD, DATABASE_HOST,
                      DATABASE_PORT, DATABASE_NAME)
session = dataModel.createSession(False)

for root, dirs, files in os.walk(report_dir):
    for sig_file in files:
        try:
            if sig_file.endswith('gexf') and not sig_file.startswith('iceReport'):
                md5 = sig_file[:-5]
                # static json
                static_path = os.path.join(report_dir, md5, 'static.json')
                try:
                    fobj = open(static_path, 'r')
                    static_json = json.loads(fobj.read())
                    fobj.close()
                except Exception, e:
                    print traceback.print_exc()
                    continue
                
                main_activity = static_json.get('MainActivity')
                
                basic_info = static_json.get('Basic')
                classifications = static_json.get('Classify')
                
                activities = static_json.get('Activities')
                exposed_activities = static_json.get('ExposedActivities')
                
                services = static_json.get('Services')
                exposed_services = static_json.get('ExposedServices')
                
                receivers = static_json.get('Receivers')
                exposed_receivers = static_json.get('ExposedReceivers')
                
                providers = static_json.get('Providers')
                
                strs = static_json.get('Str')
                urls = static_json.get('Url')
                apis = static_json.get('API')
                ads = static_json.get('Ads')
                
                permissions = static_json.get('Perm')
                
                repackaged = static_json.get('Repackaged')
                
                file_md5 = basic_info.get('FileMD5')
                file_name = basic_info.get('FileName')
                size = basic_info.get('FileSize')
                pkg_name = basic_info.get('Package')
                app_name = basic_info.get('Application')
                
                
                min_sdk = basic_info.get('MinSDK')
                target_sdk = basic_info.get('TargetSDK')
                risk_score = '%.2f' % float(static_json.get('Risk'))
                rist_score = str(risk_score)
                
                signature = basic_info.get('Cert')
                country = signature.get('C')
                sha1 = signature.get('SHA1')
                company_name = signature.get('CN')
                location = signature.get('L')
                organization = signature.get('O')
                organization_unit = signature.get('OU')
                state = signature.get('ST')
                
                apk = APK(file_md5=file_md5, file_name=file_name, size=size, pkg_name=pkg_name,
                          min_sdk=min_sdk, target_sdk=target_sdk, risk_score=risk_score, application_name=app_name,
                          repackaged=repackaged, analyzed=True)
                session.add(apk)
                if repackaged:
                    threat_db = session.query(Threat).filter(type==ThreatType.REPACKAGED).first()
                    if not threat_db:
                        threat_db = Threat(type=ThreatType.REPACKAGED)
                    if threat_db not in apk.threats:
                        apk.threats.append(threat_db)
                
                for apptype in APP_TYPES:
                    apptype_db = session.query(AppType).filter(AppType.name == apptype).first()
                    if apptype_db:
                        apptype_db.used_count += 1
                    else:
                        apptype_db = AppType(name=apptype, used_count=1)
                    apk.app_types.append(apptype_db)
                    
                for maltype in MAL_TYPES:
                    maltype_db = session.query(MalwareType).filter(MalwareType.name == maltype).first()
                    if maltype_db:
                        maltype_db.used_count += 1
                    else:
                        maltype_db = MalwareType(name=maltype, used_count=1)
                    apk.malware_types.append(maltype_db)
                    
                
                
                signature_db = Signature(sha1=sha1, country=country, company_name=company_name,
                                         location=location, organization=organization, organization_unit=organization_unit,
                                         state=state)
                apk.signature = signature_db
                
                for classification_name, classification_values in classifications.items():
                    classification_db = Classification(name=classification_name,
                                                       map=classification_values.get('map'),
                                                       network=classification_values.get('network'),
                                                       normal=classification_values.get('normal'),
                                                       system=classification_values.get('system'),
                                                       camera=classification_values.get('camera'),
                                                       callsms=classification_values.get('callsms'))
                    apk.classifications.append(classification_db)
                    
                for activity in activities:
                    activity_db = Activity(name=activity)
                    if activity == main_activity:
                        activity_db.main_activity = True
                    if exposed_activities:
                        if activity in exposed_activities:
                            activity_db.exposed = True
                    apk.activities.append(activity_db)
                    
                for service in services:
                    service_db = Service(name=service)
                    if exposed_services:
                        if service in exposed_services:
                            service_db.exposed = True
                    apk.services.append(service_db)
                    
                for receiver in receivers:
                    receiver_db = Receiver(name=receiver)
                    if exposed_receivers:
                        if receiver in exposed_receivers:
                            receiver_db.exposed = True
                    apk.receivers.append(receiver_db)
                    
                for provider in providers:
                    provider_db = ContentProvider(name=provider)
                    apk.content_providers.append(provider_db)
                    
                for permission_name, permission_data in permissions.items():
                    permission_db = session.query(Permission).filter(Permission.name==permission_name).first()
                    if permission_db:
                        permission_db.used_count += 1
                    else:
                        permission_db = Permission(name=permission_name, threat=THREAT.get(permission_data[0]),
                                                   description=permission_data[1], used_count=1)
                    if permission_name == 'android.permission.SEND_SMS':
                        threat_db = session.query(Threat).filter(Threat.type == ThreatType.MAY_SEND_SMS).first()
                        if not threat_db:
                            threat_db = Threat(type=ThreatType.MAY_SEND_SMS)
                        if threat_db not in apk.threats:
                            apk.threats.append(threat_db)
                    if permission_name in ['com.google.android.c2dm.permission.RECEIVE',
                                           'com.google.android.c2dm.permission.SEND']:
                        threat_db = session.query(Threat).filter(Threat.type == ThreatType.C2DM).first()
                        if not threat_db:
                            threat_db = Threat(type=ThreatType.C2DM)
                        if threat_db not in apk.threats:
                            apk.threats.append(threat_db)
                    
                    apk.permissions.append(permission_db)
                    
                for url in urls:
                    url_db = Url(name=url)
                    apk.urls.append(url_db)
                    
                for ad_pkg, ad_list in ads.items():
                    ad_db = session.query(Ad).filter(Ad.name==ad_list[0]).first()
                    if ad_db:
                        ad_db.used_count += 1
                    else:
                        ad_db = Ad(name=ad_list[0], link=ad_list[1], used_count=1)
                        
                    apk.ads.append(ad_db)
                    
                # dynamic json
                dynamic_path = os.path.join(report_dir, md5, 'dynamic.json')
                try:
                    fobj = open(dynamic_path, 'r')
                    dynamic_json = json.loads(fobj.read())
                    fobj.close()
                except Exception,e:
                    print traceback.print_exc()
                    continue
                
                started_services = dynamic_json.get('Serv')
                
                receive_nets = dynamic_json.get('RecvNet')
                open_nets = dynamic_json.get('OpenNet')
                sent_nets = dynamic_json.get('SentNet')
                closed_nets = dynamic_json.get('ClosedNet')
                data_leaks = dynamic_json.get('Leak')
                calls = dynamic_json.get('Call')
                text_msgs = dynamic_json.get('SMS')
                dexloaders = dynamic_json.get('Dex')
                
                file_operations = dynamic_json.get('FileRW')
                
                for started_service in started_services:
                    started_service_db = StartedService(name=started_service.get('name'))
                    apk.started_services.append(started_service_db)
                
                if receive_nets or open_nets or sent_nets or closed_nets:
                    threat_db = session.query(Threat).filter(Threat.type == ThreatType.INTERNET).first()
                    if not threat_db:
                        threat_db = Threat(type=ThreatType.INTERNET)
                    if threat_db not in apk.threats:
                        apk.threats.append(threat_db)
                        
                for receive_net in receive_nets:
                    data = receive_net.get('data')
                    port = receive_net.get('srcport')
                    host = receive_net.get('srchost')
                    
                    receive_net_db = NetOperation(type='Receive', host=host, port=port, data=data)
                    apk.net_operations.append(receive_net_db)
                    
                for open_net in open_nets:
                    port = open_net.get('destport')
                    host = open_net.get('desthost')
                    
                    open_net_db = NetOperation(type='Open', host=host, port=port)
                    apk.net_operations.append(open_net_db)
                    
                for sent_net in sent_nets:
                    data = sent_net.get('data')
                    port = sent_net.get('destport')
                    host = sent_net.get('desthost')
                    
                    sent_net_db = NetOperation(type='Sent', host=host, port=port, data=data)
                    apk.net_operations.append(sent_net_db)
                    
                for closed_net in closed_nets:
                    port = closed_net.get('destport')
                    host = closed_net.get('desthost')
                    
                    closed_net_db = NetOperation(type='Closed', host=host, port=port)
                    apk.net_operations.append(closed_net_db)
                    
                for data_leak in data_leaks:
                    type = data_leak.get('sink')
                    tag = data_leak.get('tag')
                    if type == 'Network':
                        dest = '%s:%s' % (data_leak.get('desthost'), data_leak.get('destport'))
                    elif type == 'File':
                        dest = ''
                    elif type == 'SMS':
                        dest = data_leak.get('number')
                    data = data_leak.get('data')
                    data_leak_db = DataLeak(type=type, tag=tag, dest=dest, data=data)
                    apk.data_leaks.append(data_leak_db)
                    
                for call in calls:
                    number = call.get('number')
                    call_db = Call(number=number)
                    apk.calls.append(call_db)
                    
                for text_msg in text_msgs:
                    number = text_msg.get('number')
                    msg = text_msg.get('message')
                    text_msg_db = Sms(number=number, msg=msg)
                    apk.text_msgs.append(text_msg_db)
                if text_msgs:
                    threat_db = session.query(Threat).filter(Threat.type == ThreatType.SEND_SMS).first()
                    if not threat_db:
                        threat_db = Threat(type=ThreatType.SEND_SMS)
                    if threat_db not in apk.threats:
                        apk.threats.append(threat_db)
                    
                print dexloaders
                
                session.commit()
        except Exception,e:
            print traceback.print_exc()
            continue
                

                
            
            
                
            
            
            
