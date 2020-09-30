#!/usr/bin/env python
# -*- coding: utf-8 -*-
import string
import random
import base64
import uuid
import hashlib
import re

from models import APK, RegistrationCode

# --------- Front-end web form arguments
class FormArguments:
    email = 'email'
    pswd = 'password'
    remember = 'remember'
    regist_code = 'regist_code'
    name = 'username'
    pswd_confirm = 'password_confirm'
    
    file_md5 = 'file_md5'
    file_type = 'file_type'
    signature = 'signature'
    version = 'version'
    pkg = 'pkg'
    malware_type = 'mal_type'
    
    upload_file = 'uploadfile'
    
    remark = 'remark'
    feature1 = 'feature1'
    feature2 = 'feature2'
    feature3 = 'feature3'
    apptypes = 'apptypes'
    maltypes = 'maltypes'
    
#------------ Front-end datatable arguments
class TableArguments:
    # the column_header must be the same order as front-end table coloumn
    column_header = [   APK.file_md5,
                        APK.file_name,
                        APK.pkg_name,
                        APK.malware_types,
                        #added by songalee at 20170725
                        APK.check_time
                     ]
    analyzed_column_header = [   APK.file_md5, 
                                 APK.application_name,
                                 APK.pkg_name,
                                 APK.risk_score,
                                 APK.malware_types,
                                 APK.manual_review
                              ]
    
    ubanalyzed_column_header = [    APK.file_md5, 
                                    APK.file_name
                                ]
    
    # request arguments
    display_start = 'iDisplayStart'
    display_length = 'iDisplayLength'
    s_echo = 'sEcho'
    i_sorting_cols = 'iSortingCols'
    i_sort_col = 'iSortCol'
    s_sort_dir = 'sSortDir'
    
    is_search = 'is_search'

    
def generate_registration_code(size=16):
    chars = string.ascii_uppercase + string.digits
    code = ''.join(random.choice(chars) for x in range(size))
    registration_code = RegistrationCode(code)
    
    return registration_code
    
def store_registration_code(session, number=10):
    for i in range(number):
        registration_code = generate_registration_code()
        session.add(registration_code)
    session.commit()
    
def generate_salt():
    # need rewrite
    chars = string.ascii_uppercase + string.digits
    code = ''.join(random.choice(chars) for x in range(32))
    return code
    
def generate_secret_cookie():
    return base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)

def get_str_md5(str):
    str_md5 = hashlib.md5(str)
    str_md5.digest()
    return str_md5.hexdigest()

#------------ Form validation check ---------------
def regist_code_check(regist_code):
    reg = r'^[\w]{16}$'
    return re.match(reg, regist_code)

def email_check(email):
    reg = '^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$'
    return re.match(reg, email)

def name_check(name):
    reg = '^[\w\.]{4,32}$'
    return re.match(reg, name)

def pswd_check(pswd):
    reg = '^.{8,}$'
    return re.match(reg, pswd)

def pswd_confirm(pswd, pswd_to_match):
    return pswd == pswd_to_match

#store_registration_code()



