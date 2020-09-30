#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Tornado web settings
import os
import re

#import utils

DEFAULT_COOKIE_EXPIRES = 7
REMEMBER_COOKIE_EXPIRES = 30
 
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), r'template')
STATIC_PATH = os.path.join(os.path.dirname(__file__), r'static')
DEBUG = True
COOKIE_SECRET = 'JhPAdWWGQWCVOeWlDoLrnErBiEkRvE3ap4tJ1QLCXu0='

settings = {
                "template_path": TEMPLATE_PATH,
                "static_path": STATIC_PATH,
                "debug": DEBUG,
                "cookie_secret": COOKIE_SECRET,
                "login_url": "/auth/login/"
            }