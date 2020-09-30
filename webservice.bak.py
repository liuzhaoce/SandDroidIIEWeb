#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Webservice module
from __future__ import division
from config import  UPLOAD_DIR, REPORT_DIR, MAX_FILE_SIZE, FILE_TYPES

import os
import sys
import multiprocessing
import json
import tornado.ioloop
import tornado.websocket

from tornado.web import RequestHandler, Application
from tornado.escape import json_encode,xhtml_escape
from tornado.options import define, options

from sqlalchemy.orm import scoped_session
from sqlalchemy import func, distinct

from websettings import settings, REMEMBER_COOKIE_EXPIRES, DEFAULT_COOKIE_EXPIRES
from config import *
from utils import *
from models import *


dataModel = DataModel(DATABASE_USER, DATABASE_PSWD, DATABASE_HOST,
                      DATABASE_PORT, DATABASE_NAME)
Session = scoped_session(dataModel.createSession(False))

#session = Session()

# def get_sample_number():
#     session.rollback()
#     return session.query(APK).count()

#old_sample_num = get_sample_number()

# some base classes
class BaseHandler(RequestHandler):
    def initialize(self):
        self.set_header("Content-Type", 'application/json')
        self.session = Session()
        
    def get_int_argument(self, arg, default_val):
        try:
            value = self.get_argument(arg, default_val)
            try:
                value = int(value.strip())
            except AttributeError:
                return value
        except ValueError:
            return 0
        
        return value
    
    def get_str_argument(self, arg, default_val):
        try:
            value = str(self.get_argument(arg, default_val))
            value = value.strip()
        except ValueError:
            return ''
        
        return value
    
    def get_boolen_argument(self, arg, default_val):
        value = self.get_str_argument(arg, default_val)
        if value == 'true':
            return True
        else:
            return False
        
    def on_finish(self):
        self.session.close()
        
        
class AuthHandler(RequestHandler):
    def initialize(self):
        self.session = Session()
        
    def set_current_user(self, user_name, expires_days=DEFAULT_COOKIE_EXPIRES):
        if user_name:
            self.set_secure_cookie('user', json_encode(user_name), expires_days)
        else:
            self.clear_cookie('user')
            
    def get_current_user(self):
        return self.get_secure_cookie('user')
    
    def store_ip(self, user):
        ip_addr = self.request.remote_ip
        if ip_addr:
            ip_db = self.session.query(IP).filter(IP.ip_addr==ip_addr).first()
            if not ip_db or (ip_db not in user.ip_list):
                new_ip_db = IP(ip_addr=ip_addr)
                user.ip_list.append(new_ip_db)
                self.session.add(new_ip_db)
                self.session.commit()
                
    def get_int_argument(self, arg, default_val):
        try:
            value = self.get_argument(arg, default_val)
            try:
                value = int(value.strip())
            except AttributeError:
                return value
        except ValueError:
            return 0
        
        return value
    
    def get_str_argument(self, arg, default_val):
        try:
            value = str(self.get_argument(arg, default_val))
            value = value.strip()
        except ValueError:
            return ''
        
        return value
    
    def get_boolen_argument(self, arg, default_val):
        value = self.get_str_argument(arg, default_val)
        if value == 'true':
            return True
        else:
            return False
                
    def on_finish(self):
        self.session.close()
  

# index handler     
class MainHandler(AuthHandler):
    def get(self):
        user_name = ''
        if self.current_user:
            user_name = self.current_user.split('"')[1]
        self.render('index.html', user_name=user_name)

# --------------------- user authentication --------------------
class AuthLoginHandler(AuthHandler):
    def post(self):
        validated = False
        errmsg = ''
        name = ''
        
        email = self.get_str_argument(FormArguments.email,"")
        
        pswd = self.get_str_argument(FormArguments.pswd,"")
        
        remember = self.get_str_argument(FormArguments.remember, "")
        
        if self.form_check(email, pswd):
            user = self.session.query(User).filter(User.email == email).first()
            if user:
                pswd_salt_md5 = get_str_md5('%s%s' % (pswd, user.salt))
                if pswd_salt_md5 == user.pswd:
                    validated = True
                    name = user.name
                    self.store_ip(user)
                    
            else:
                errmsg = 'No such user!'
        else:
            errmsg = 'Opps! Please check the input!'
               
        if validated:
            if remember:
                self.set_current_user(name, expires_days=REMEMBER_COOKIE_EXPIRES)
            else:
                self.set_current_user(name)
              
        self.write(json.dumps({'validated': validated, 'name': name, 'errmsg': errmsg}))
        
    def form_check(self, email, pswd):
        if not email_check(email):
            return False
        if not pswd_check(pswd):
            return False
        
        return True

class AuthLogoutHandler(AuthHandler):        
    def post(self):
        self.clear_cookie('user')
        self.write(json.dumps({'success': True}))

class AuthSignUpHandler(AuthHandler):
    def post(self):
        validated = False
        errmsg = ''
        
        regist_code = self.get_str_argument(FormArguments.regist_code, "")
        email = self.get_str_argument(FormArguments.email,"")
        name = self.get_str_argument(FormArguments.name, "")
        pswd = self.get_str_argument(FormArguments.pswd,"")
        pswd_confirm = self.get_str_argument(FormArguments.pswd_confirm, "")
        
        if self.form_check(regist_code, email, name, pswd, pswd_confirm):
            regist_code_db = self.session.query(RegistrationCode)\
                            .filter(RegistrationCode.code == regist_code)\
                            .filter(RegistrationCode.used == False).first()
            if not regist_code_db:
                errmsg = 'Registration code not right!'
            else:
                email_db = self.session.query(User.email).filter(User.email == email).first()
                if email_db:
                    errmsg = 'User exists!'
                else:
                    validated = True
                    regist_code_db.used = True
                    salt = generate_salt()
                    pswd_salt = get_str_md5('%s%s' % (pswd, salt))
                    user = User(name=name, email=email, pswd=pswd_salt, salt=salt)
                    self.session.add(user)
                    self.session.commit()
                    self.store_ip(user)
        else:
            errmsg = 'Opps! Please check the input!'
                
        if validated:
            self.set_current_user(name)
              
        self.write(json.dumps({'validated': validated, 'name': name, 'errmsg': errmsg}))
        
    def form_check(self, regist_code, email, name, pswd, pswd_to_match):
        if not regist_code_check(regist_code):
            return False
        if not email_check(email):
            return False
        if not name_check(name):
            return False
        if not pswd_check(pswd):
            return False
        if not pswd_confirm(pswd, pswd_to_match):
            return False
        
        return True

# ----------------- apk info handler ----------------------------
class ApkInfoHandler(BaseHandler):
    def search(self, request):
        is_search = request.get_boolen_argument(TableArguments.is_search, 'false')
        
        #self.session.rollback()
        session_query = self.session.query(APK).join(Signature).filter(APK.analyzed == True)
        
        if is_search:
            file_md5 = request.get_str_argument(FormArguments.file_md5, "")
            signature = request.get_str_argument(FormArguments.signature, "")
            version = request.get_str_argument(FormArguments.version, "")
            pkg = request.get_str_argument(FormArguments.pkg, "")
            malware_type = request.get_str_argument(FormArguments.malware_type, "")
            if file_md5:
                session_query = self.queryMd5(file_md5, session_query)
            if signature:
                session_query = self.querySignature(signature, session_query)
            if version:
                session_query = self.queryVersion(version, session_query)
            if pkg:
                session_query = self.queryPkg(pkg, session_query)
            if malware_type:
                session_query = self.queryMalType(malware_type, session_query)
            
                
        return session_query
                
                
    def to_json(self, apks):
        results = []
        for apk in apks:
            result = []
            #Warning: the order of append must be the same as the front-end table column header
            result.append(apk.file_md5.upper())
            #result.append(apk.application_name)
            result.append(apk.pkg_name)
            result.append(apk.risk_score)
                
            result.append(apk.manual_review)
            
            threats = []
            for threat in apk.threats:
                threats.append(threat.type)
            result.append(threats)
            
            results.append(result)
            
        return results
    
    def queryMd5(self, file_md5, session_query):
        return session_query.filter(APK.file_md5.ilike('%%%s%%' % file_md5))
    
    def querySignatue(self, signatue, session_query):
        return session_query.filter(func.upper(Signature.sha1) == func.upper(signatue))

    def queryVersion(self, version, session_query):
        return session_query.filter(func.lower(APK.version_code) == func.lower(version))
    
    def queryPkg(self, pkg, session_query):
        print pkg
        return session_query.filter(APK.pkg_name.ilike('%%%s%%' % pkg))
    
    def queryMalType(self, malware_type, session_query):
        maltype_dbs = self.session.query(MalwareType).filter(MalwareType.name.ilike('%%%s%%') % malware_type).all()
        for maltype_db in maltype_dbs:
            session_query = session_query.filter(APK.malware_types.contains(maltype_db))
        return session_query
        
    def process_table(self, session_query, column_header):
        display_start = self.get_int_argument(TableArguments.display_start, 0)
        display_length = self.get_int_argument(TableArguments.display_length, 10)
        s_echo = self.get_int_argument(TableArguments.s_echo, 1)
        i_sorting_cols = self.get_int_argument(TableArguments.i_sorting_cols, 1)
        
        # process sorting
        for i in range(i_sorting_cols):
            i_sort_col = self.get_int_argument('%s_%d' % (TableArguments.i_sort_col, i), 0)
            s_sort_dir = self.get_str_argument('%s_%d' % (TableArguments.s_sort_dir, i), 'asc')
            
            if s_sort_dir == 'desc':
                session_query = session_query.order_by(column_header[i_sort_col].desc())
            else:
                session_query = session_query.order_by(column_header[i_sort_col])
                
        total_records = session_query.count()
        apks = session_query.limit(display_length).offset(display_start).all()
        
        aa_data = self.to_json(apks)
        
        results_json = json.dumps({
                                   "sEcho": s_echo,
                                   "iTotalRecords": total_records,
                                   "iTotalDisplayRecords": total_records,
                                   "aaData": aa_data
                                   })
        
        return results_json
  
# the overview table handler  
class ApkTableInfoHandler(ApkInfoHandler):
    def post(self):
        session_query = self.search(self)
                
        results_json = self.process_table(session_query, TableArguments.analyzed_column_header)
        
        self.write(results_json)
        


# -------------------------------- view report --------------------------------
class ReportViewHandler(AuthHandler):
    def get(self):
        user_name = ''
        if self.current_user:
            user_name = self.current_user.split('"')[1]
        file_md5 = self.get_argument(FormArguments.file_md5, '')
        icon_path = os.path.join(REPORT_DIR, file_md5, 'icon.png')
        icon_exists = False
        if os.path.exists(icon_path):
            icon_exists = True
        screenshot_path = os.path.join(REPORT_DIR, file_md5, 'screenshot.png')
        screenshot_exists = False
        if os.path.exists(screenshot_path):
            screenshot_exists = True
        self.render('report.html', user_name=user_name, file_md5=file_md5, 
                    icon_exists=icon_exists, screenshot_exists=screenshot_exists)
        
class ReportInfoHandler(BaseHandler):
    def post(self):
        file_md5 = self.get_str_argument(FormArguments.file_md5, '')
        self.results_json = {}
        if file_md5:
            file_md5 = file_md5.upper()
            #self.session.rollback()
            self.apk = self.session.query(APK).filter(APK.file_md5 == file_md5).first()
            if self.apk:
                # process information
                self.process_static_info()
                self.process_dynamic_info()
        self.write(json.dumps(self.results_json))   
                
    # process static analysis information            
    def process_static_info(self):
        self.process_basic()
        self.process_features()
        self.process_classifications()
        self.process_certification()
        self.process_code()
        self.process_ads()
        self.process_components()
        self.process_permissions()
        self.process_strs()
        
    # process dynamic analysis information     
    def process_dynamic_info(self):
        self.process_started_services()
        self.process_net_operations()
        self.process_file_operations()
        self.process_encryptions()
        self.process_dataleaks()
        self.process_calls()
        self.process_textmsgs()
     
    def process_basic(self):
        apk = self.apk
        results_json = self.results_json
        data = []
        data.append(apk.file_md5)
        data.append(apk.pkg_name)
        data.append(apk.size)
        data.append(apk.min_sdk)
        data.append(apk.target_sdk)
        data.append(apk.risk_score)
        data.append(apk.remark)
        mal_types = []
        for mal_type in apk.malware_types:
            mal_types.append(mal_type.name)
        data.append(','.join(mal_types))
        app_types = []
        for app_type in apk.app_types:
            app_types.append(app_type.name)
        data.append(','.join(app_types))
        
        results_json['basic'] = data
        results_json['repackaged'] = apk.repackaged
        
        # threats information
        threats = []
        for threat in apk.threats:
            threats.append(threat.type)
        results_json['threats'] = threats
        
        # download files
        download_files = {}
        report_dir = os.path.join(REPORT_DIR, apk.file_md5)
        pcap_file = os.path.join(report_dir, '%s.pcap' % apk.file_md5)
        gexf_file = os.path.join(report_dir, '%s.gexf' % apk.file_md5)
        if os.path.exists(pcap_file):
            download_files['pcap'] = True
        else:
            download_files['pcap'] = False
        if os.path.exists(gexf_file):
            download_files['gexf'] = True
        else:
            download_files['gexf'] = False
        results_json['download'] = download_files
        #self.write(results_json)
        
    def process_features(self):
        apk = self.apk
        results_json = self.results_json
        data = []
        if apk.features:
            data.append(apk.features.feature1)
            data.append(apk.features.feature2)
            data.append(apk.features.feature3)
        results_json['features'] = data

                
    def process_classifications(self):
        apk = self.apk
        results_json = self.results_json
        classifications_json = {}
        classifications = apk.classifications
        if classifications:
            for classification in classifications:
                classifications_json[classification.name] = []
                classifications_json[classification.name].append(['map', float(classification.map)])
                classifications_json[classification.name].append(['network', float(classification.network)])
                classifications_json[classification.name].append(['normal', float(classification.normal)])
                classifications_json[classification.name].append(['system', float(classification.system)])
                classifications_json[classification.name].append(['camera', float(classification.camera)])
                classifications_json[classification.name].append(['callsms', float(classification.callsms)])

        results_json['classifications'] = classifications_json
        
    def process_certification(self):
        apk = self.apk
        results_json = self.results_json
        data = []
        signature = apk.signature
        if signature:
            data.append(signature.sha1)
            data.append(signature.country)
            data.append(signature.company_name)
            data.append(signature.location)
            data.append(signature.organization)
            data.append(signature.organization_unit)
            data.append(signature.state)
        
        results_json['certification'] = data
        
    def process_code(self):
        apk = self.apk
        results_json = self.results_json
        data = []
        data.append(apk.native_used)
        data.append(apk.dynamic_used)
        data.append(apk.reflection_used)
        data.append(apk.crypto_used)
        
        results_json['code'] = data
        
    def process_ads(self):
        apk = self.apk
        results_json = self.results_json
        data = []
        for ad in apk.ads:
            data.append([ad.name, ad.link])
        
        results_json['ads'] = data
        
    def process_components(self):
        apk = self.apk
        results_json = self.results_json
        activities = []
        receivers = []
        services = []
        providers = []

        for activity in apk.activities:
            activities.append([activity.name, activity.main_activity, activity.exposed])
        for receiver in apk.receivers:
            receivers.append([receiver.name, receiver.exposed])
        for service in apk.services:
            services.append([service.name, service.exposed])
        for provider in apk.content_providers:
            providers.append([provider.name, provider.exposed])
                
        results_json['activities'] = activities
        results_json['receivers'] = receivers
        results_json['services'] = services
        results_json['providers'] = providers
              
    def process_permissions(self):
        apk = self.apk
        results_json = self.results_json
        permissions = []
        for permission in apk.permissions:
            permissions.append([permission.name, permission.threat, permission.description])
                
        results_json['permissions'] = permissions
        
    def process_strs(self):
        apk = self.apk
        results_json = self.results_json
        
        strs = []
        apis = []
        urls = []
        
        for s_str in apk.sensitive_strs:
            strs.append([s_str.name, s_str.short_desc])
        for api in apk.sensitive_apis:
            apis.append([api.name, api.short_desc])
        for url in apk.urls:
            urls.append(url.name)
                
        results_json['strs'] = strs
        results_json['apis'] = apis
        results_json['urls'] = urls
        
    def process_started_services(self):
        apk = self.apk
        results_json = self.results_json
        services = []
    
        for service in apk.started_services:
            services.append(service.name)
                
        results_json['started_services'] = services
        
    def process_net_operations(self):
        apk = self.apk
        results_json = self.results_json
        net_operations = []
        
        for net_operation in apk.net_operations:
            net_operations.append([net_operation.type, net_operation.host, 
                                   net_operation.port, net_operation.data])
                
        results_json['net_operations'] = net_operations
        
    def process_file_operations(self):
        apk = self.apk
        results_json = self.results_json
        
        file_operations = []
        
        for file_operation in apk.file_operations:
            file_operations.append([file_operation.type, file_operation.path, file_operation.data])
        
        results_json['file_operations'] = file_operations
        
    def process_encryptions(self):
        apk = self.apk
        results_json = self.results_json
        encryptions = []
        
        for encryption in apk.encryptions:
            encryptions.append([encryption.key, encryption.algo, 
                                encryption.type, encryption.data])
                
        results_json['encryptions'] = encryptions
        
    def process_dataleaks(self):
        apk = self.apk
        results_json = self.results_json
        dataleaks = []
        
        for dataleak in apk.data_leaks:
            dataleaks.append([dataleak.type, dataleak.tag, 
                                dataleak.dest, dataleak.data])
                
        results_json['dataleaks'] = dataleaks
        
    def process_calls(self):
        apk = self.apk
        results_json = self.results_json
        calls = []
    
        for call in apk.calls:
            calls.append([call.number])
                
        results_json['calls'] = calls
        
    def process_textmsgs(self):
        apk = self.apk
        results_json = self.results_json
        textmsgs = []
        
        for textmsg in apk.text_msgs:
            textmsgs.append([textmsg.number, textmsg.msg])
        
        results_json['textmsgs'] = textmsgs
        
# -------------------------------- manage ---------------------------------
class ManageHandler(AuthHandler):
    def get(self):
        user_name = ''
        if self.current_user:
            user_name = self.current_user.split('"')[1]
        self.render('manage.html', user_name=user_name)
        
class ApkAnalyzedInfoHandler(ApkInfoHandler):
    def post(self):
        session_query = self.search(self)
                
        results_json = self.process_table(session_query, TableArguments.analyzed_column_header)
        
        self.write(results_json)
        
class ApkUnanalyzedInfoHandler(ApkInfoHandler):
    def to_json(self, apks):
        results = []
        for apk in apks:
            result = []
            #Warning: the order of append must be the same as the front-end table column header
            if apk.file_md5 and apk.file_name:
                result.append(apk.file_md5.upper())
                result.append(apk.file_name)

                results.append(result)
            
        return results
    
    
    def post(self):
        #self.session.rollback()
        session_query = self.session.query(APK).filter(APK.analyzed == False)
                
        results_json = self.process_table(session_query, TableArguments.analyzed_column_header)
        
        self.write(results_json)
    
class ApkChartsHandler(ApkInfoHandler):
    def post(self):
        self.is_search = self.get_boolen_argument(TableArguments.is_search, 'false')
        
        self.session_query = self.search(self)
        self.results_json = {}
        
        #------------- process charts -------------
        self.process_permission_chart()
        self.process_maltype_chart()
        self.process_code_chart()
        self.process_riskscore_chart()
        
        self.write(self.results_json)

    def process_permission_chart(self):        
        # process permission
        session_query = self.session_query
        if not self.is_search:
            permissions_db = self.session.query(Permission).order_by(Permission.used_count.desc()).limit(20).all()
            permissions_json = []
            for permission in permissions_db:
                permission_name = permission.name.split('.')[-1]
                permissions_json.append([permission_name, permission.used_count])
        else:
            permissions_dict = {}
            permission_names = self.session.query(distinct(Permission.name)).all()
            for permission_name in permission_names:
                permission_name = permission_name[0]
                permission_db = self.session.query(Permission).filter(Permission.name == permission_name).first()
                count = session_query.filter(APK.permissions.contains(permission_db)).count()
                if count > 0:
                    permissions_dict[permission_name] = count
            
            permissions_json = self.get_top_permissions(permissions_dict, 20)   
          
        
        self.results_json['permissions'] = permissions_json
           
    def get_top_permissions(self, permissions_dict, top_num):
        permissions_count = []
        permissions_tmp_dict = permissions_dict 
        for i in range(top_num):
            cur_max = 0
            cur_permission = None
            for permission, count in permissions_tmp_dict.items():
                if cur_max < count:
                    cur_max = count
                    cur_permission = permission
            if cur_permission:
                del permissions_tmp_dict[cur_permission]
                cur_permission = cur_permission.split('.')[-1]
                permissions_count.append([cur_permission, cur_max])
                
            
        return permissions_count
    
    def process_maltype_chart(self):
        session_query = self.session_query
        
        # process malware type
        if not self.is_search:
            maltypes_db = self.session.query(MalwareType).order_by(MalwareType.used_count.desc()).all()
            maltypes_json = []
            for maltype in maltypes_db:
                maltypes_json.append([maltype.name, maltype.used_count])
        else:
            maltypes_dict = {}
            maltype_names = self.session.query(distinct(MalwareType.name)).all()
            for maltype_name in maltype_names:
                maltype_name = maltype_name[0]
                maltype_db = self.session.query(MalwareType).filter(MalwareType.name == maltype_name).first()
                count = session_query.filter(APK.malware_types.contains(maltype_db)).count()
                if count > 0:
                    maltypes_dict[maltype_name] = count
            
            maltypes_json = self.sort(maltypes_dict)   
               
        self.results_json['maltypes'] = maltypes_json
           
    def sort(self, maltypes_dict):
        maltypes_count = []
        maltypes_tmp_dict = maltypes_dict 
        dict_len = len(maltypes_dict)
        for i in range(dict_len):
            cur_max = 0
            cur_maltype = None
            for maltype, count in maltypes_tmp_dict.items():
                if cur_max < count:
                    cur_max = count
                    cur_maltype = maltype
            if cur_maltype:
                maltypes_count.append([cur_maltype, cur_max])
                del maltypes_tmp_dict[cur_maltype]
            
        return maltypes_count
                    
    def process_code_chart(self):
        session_query = self.session_query
        
        code_json = []  
        native_used = session_query.filter(APK.native_used == True).count()
        dynamic_used = session_query.filter(APK.dynamic_used == True).count()
        reflection_used = session_query.filter(APK.reflection_used == True).count()
        code_json.append(['Dynamic Loading', dynamic_used])
        code_json.append(['Native', native_used])
        code_json.append(['Reflection', reflection_used])
        
        self.results_json['code'] = code_json

    def process_riskscore_chart(self):
        session_query = self.session_query
        
        riskscore_json = []  
        start_score = 0
        step = 10
        cur_score = start_score
        total_count = session_query.count()
        
        while cur_score < 100:
            count = session_query.filter(APK.risk_score.between(str(cur_score), str(cur_score+step))).count()
            if cur_score == 80:
                riskscore_json.append({
                                       'name': '%s-%s' % (cur_score, cur_score+step),
                                       'y': float('%.2f' % (count/total_count * 100)),
                                       'sliced': True,
                                       'selected': True})
            else:
                riskscore_json.append(['%s-%s' % (cur_score, cur_score+step), float('%.2f' % (count/total_count * 100))])
            cur_score += step
        
        self.results_json['risk_score'] = riskscore_json

        
class AppMalTypeHandler(BaseHandler):
    def post(self):
        apptype_list = []
        maltype_list = []
        #self.session.rollback()
        apptypes = self.session.query(distinct(AppType.name)).all()
        for apptype in apptypes:
            apptype = apptype[0]
            apptype_list.append({'label': apptype,
                                 'value': apptype})
            
        maltypes = self.session.query(distinct(MalwareType.name)).all()
        for maltype in maltypes:
            maltype = maltype[0]
            maltype_list.append({'label': maltype,
                                 'value': maltype})
        result_json = json.dumps({'apptype': apptype_list, 'maltype': maltype_list})
        self.write(result_json)
        
class ReportEditHandler(BaseHandler):
    def post(self):
        update = False
        data = self.get_str_argument('data', '')
        if data:
            data_py = json.loads(data)
            
        md5 = data_py.get(FormArguments.file_md5)
        remark = data_py.get(FormArguments.remark)
        feature1 = data_py.get(FormArguments.feature1)
        feature2 = data_py.get(FormArguments.feature2)
        feature3 = data_py.get(FormArguments.feature3)
        
        maltypes = data_py.get(FormArguments.maltypes)
        apptypes = data_py.get(FormArguments.apptypes)
        
        #self.session.rollback()
        if md5:
            md5 = md5.upper()
            apk = self.session.query(APK).filter(APK.file_md5 == md5).first()
            if apk:
                if not apk.features:
                    features = Features()
                    apk.features = features
                if remark:
                    update = True
                    apk.remark = remark
                if feature1:
                    update = True
                    apk.features.feature1 = feature1
                if feature2:
                    update = True
                    apk.features.feature2 = feature2
                if feature3:
                    update = True
                    apk.features.feature3 = feature3
                
                if maltypes:
                    update = True
                    for maltype_db in apk.malware_types:
                        maltype_db.used_count -= 1
                    apk.malware_types = []
                    for maltype in maltypes:
                        maltype_db = self.session.query(MalwareType).filter(MalwareType.name == maltype).first()
                        if maltype_db:
                            apk.malware_types.append(maltype_db)
                            maltype_db.used_count += 1
                    
                if apptypes:
                    update = True
                    for apptype_db in apk.app_types:
                        apptype_db.used_count -= 1
                    apk.app_types = []
                    for apptype in apptypes:
                        apptype_db = self.session.query(AppType).filter(AppType.name == apptype).first()
                        if apptype_db:
                            apk.app_types.append(apptype_db)
                            apptype_db.used_count += 1
                            
                if update:
                    apk.manual_review = True
                    self.session.commit()
        if update:                   
            self.write(json.dumps({'update': True}))
        else:
            self.write(json.dumps({'update': False}))
            
#--------------------------------- handler for mobile ends -----------------
class MobileQueryHandler(ApkInfoHandler):
    def post(self):
        session_query = self.search(self)
        # we may need add limitation to query
        apks = session_query.all()
        
        results_json = json.dumps(self.to_json(apks))
        
        self.write(results_json)
        
    def to_json(self, apks):
        results = []
        for apk in apks:
            result = {}
            result['risk'] = apk.risk_score
            result['file_md5'] = apk.file_md5
            result['threats'] = []
            for threat in apk.threats:
                result['threats'].append(threat.type)
            result['maltypes'] = []
            for maltype in apk.malware_types:
                result['maltypes'].append(maltype.name)
            result['remark'] = apk.remark
            results.append(result)
        return results
        
           

#---------------------------------- upload -----------------------------------
class UploadHandler(BaseHandler):
    def validate(self, file_name, file_body, error):
        if not FILE_TYPES.match(file_name):
            error.append('File type invalid')  
            return False
        if len(file_body) > MAX_FILE_SIZE:
            error.append('File size exceeds')
            return False
        
        return True
       
    def file_store(self, file_path, data): 
        try:
            file_obj = open(file_path, 'wb')
            try:
                file_obj.write(data)
            except IOError, e:
                print e
        except IOError, e:
            print e
        
    def post(self):
        results_json = {}
        success = False
        msg = ''
        
        upload_files = self.request.files.get('uploadfile')
        if upload_files:
            upload_file = upload_files[0]
            file_name = upload_file.get('filename')
            file_body = upload_file.get('body')
            error = []
            if not self.validate(file_name, file_body, error):
                msg = error[0]
            else:
                success = True
                file_path = os.path.join(UPLOAD_DIR, file_name)
                self.file_store(file_path, file_body)
                
        else:
            msg = 'No file uploaded'
        
        results_json['success'] = success
        results_json['msg'] = msg
        self.write(json.dumps(results_json))
            
# --------------------- Download -------------------------------------
class DownloadHandler(BaseHandler):
    def get(self):
        file_md5 = self.get_str_argument(FormArguments.file_md5, '')
        file_type = self.get_str_argument(FormArguments.file_type, '')
        file_data = None
        if file_md5:
            file_md5 = file_md5.upper()
            file_path = os.path.join(REPORT_DIR, file_md5, '%s.%s' % (file_md5, file_type))
            if os.path.exists(file_path):
                self.set_header('Content-Type', 'application/octes-stream')
                self.set_header('Content-Disposition', 'attachment;filename=%s.%s' % (file_md5, file_type))
                try:
                    file_obj = open(file_path, 'rb')
                except IOError,e:
                    print e
                try:
                    file_data = file_obj.read()
                except IOError,e:
                    print e
                finally:
                    file_obj.close()
            else:
                self.write('<h3 style="color:red"> File doesn\'t exist! </h3>')
        if file_data:           
            self.write(file_data)
        else:
            self.finish()

            
# ------------- get the number of samples ------------     
class SampleNumberHandler(BaseHandler):
    def post(self):
        number = self.session.query(APK).count()
        
        self.write(json.dumps({'number': number}))

# def send_message(message):
#     for handler in SampleNumberSocketHandler.socket_handlers:
#         last_sample_num = 0
#         try:
#             last_sample_num = int(message)
#         except Exception,e:
#             print e
#             
#         new_sample_num = get_sample_number()
#         if last_sample_num < new_sample_num:
#             try:
#                 handler.write_message(str(new_sample_num))
#             except Exception,e:
#                 print e
#                 print 'Error sending message'
#                 
# def check_sample_number():
#     global old_sample_num
#     new_sample_num = get_sample_number()
#     if old_sample_num < new_sample_num:
#         send_message(old_sample_num)
#         old_sample_num = new_sample_num
#         
# class SampleNumberSocketHandler(tornado.websocket.WebSocketHandler):
#     socket_handlers = set()
#     
#     def open(self):
#         SampleNumberSocketHandler.socket_handlers.add(self)
#         send_message(get_sample_number())
# 
#     def on_close(self):
#         SampleNumberSocketHandler.socket_handlers.remove(self)
# 
#     def on_message(self, message):
#         send_message(message)
                 
application = Application([
            (r'/', MainHandler),
            (r'/auth/signup', AuthSignUpHandler),
            (r'/auth/login', AuthLoginHandler),
            (r'/auth/logout', AuthLogoutHandler),
            (r'/apk_table_info', ApkTableInfoHandler),
            
            # report view 
            (r'/report', ReportViewHandler),
            (r'/detail_report', ReportInfoHandler),
            (r'/appmaltype', AppMalTypeHandler),
            (r'/reportedit', ReportEditHandler),
            
            # manage 
            (r'/manage', ManageHandler),
            (r'/apk_analyzed_info', ApkAnalyzedInfoHandler),
            (r'/apk_unanalyzed_info', ApkUnanalyzedInfoHandler),
            (r'/apk_charts', ApkChartsHandler),
            
            # for mobile
            (r'/mobile_apkinfo', MobileQueryHandler),
            
            # others
            (r'/sample_number', SampleNumberHandler),
            #(r'/sample_number_socket', SampleNumberSocketHandler),
            (r'/upload', UploadHandler),
            (r'/download', DownloadHandler),
            ], **settings)

define("port", default=8000, help="run on the given port", type=int)


if __name__ == '__main__':
    tornado.options.parse_command_line()
#     def run(mid,port):
#         print "Process %d start" % mid
#         sys.stdout.flush()
#         application.listen(port)
#         main_loop = tornado.ioloop.IOLoop.instance()
#         #interval_ms = 10 * 1000
#         #scheduler = tornado.ioloop.PeriodicCallback(check_sample_number,interval_ms, io_loop = main_loop)
#         #scheduler.start()
#         main_loop.start()
#     jobs=list()
#     for mid, port in enumerate(range(9010,9014)):
#         p=multiprocessing.Process(target=run,args=(mid,port))
#         jobs.append(p)
#         p.start()
    
    print options.port
    application.listen(options.port)
    main_loop = tornado.ioloop.IOLoop.instance()
 
    #interval_ms = 10 * 1000
    #scheduler = tornado.ioloop.PeriodicCallback(check_sample_number,interval_ms, io_loop = main_loop)
 
    #scheduler.start()
    main_loop.start()


