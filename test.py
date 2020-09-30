
from __future__ import division
import re, os

import utils



#MAX_FILE_SIZE = 50*1024*1024  # bytes
#FILE_TYPES = re.compile(r'^.*[\.]((apk|zip|tar(\.gz)?))$', re.I)
#
#match_reg = FILE_TYPES.match('/home/path/wwww.APK.tar.gz')
#if match_reg:
#    print match_reg.group(1)
#    
#from models import session, APK
#
#apk = APK(md5='0000CF039DD60A3A7F1A89232898A0DA')
#session.add(apk)
#session.commit()

# fake data

from models import *
from webservice import *

print get_sample_number()
#i = 0
#for apk in apks:
#    i += 1
#    apk.native_used = True
#    if i%3 == 1:
#        apk.dynamic_used = True
#        apk.reflection_used = True
#    elif i%3 == 2:
#        apk.crypto_used = True
#        apk.reflection_used = True
#    else:
#        apk.dynamic_used = True
#        apk.crypto_used = True
#    session.commit()
# for apk in apks:
#     if apk.data_leaks:
#         print apk.file_md5
#         threat = Threat(type=ThreatType.DATA_LEAK)
#         try:
#             apk.threats.remove(threat)
#         except Exception,e:
#             print e
#         apk.threats.append(threat)
#         
#         for permission in apk.permissions:
#             if permission.name == 'android.permission.REBOOT':
#                 threat = Threat(type=ThreatType.REBOOT)
#                 apk.threats.append(threat)
#                 break
#         session.commit()

        
        
    
        




