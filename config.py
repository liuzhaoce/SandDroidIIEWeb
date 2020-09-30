#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Configure file for the project

import os
import re

# database
DATABASE_USER = 'root'
DATABASE_PSWD = 'mindmac'
DATABASE_HOST = 'localhost'
DATABASE_PORT = '3306'
DATABASE_NAME = 'iieguard'

# File path
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'samples', 'upload')
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
    
REPORT_DIR = os.path.join(os.path.dirname(__file__), 'static', 'reports')
if not os.path.exists(REPORT_DIR):
    os.makedirs(REPORT_DIR)
    
# Upload file limitations
MAX_FILE_SIZE = 50*1024*1024  # bytes
FILE_TYPES = re.compile(r'^.*[\.](apk|zip|tar(\.gz)?)$', re.I)





