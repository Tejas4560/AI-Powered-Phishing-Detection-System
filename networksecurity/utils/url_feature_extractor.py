"""
URL Feature Extractor for Phishing Detection
Extracts all 30 features from a given URL
"""

import re
import socket
import ssl
import whois
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import sys
from networksecurity.exception.exception import NetworkSecurityException


class URLFeatureExtractor:
    """Extract 30 phishing detection features from a URL"""
    
    def __init__(self, url):
        self.url = url
        self.parsed_url = urlparse(url)
        self.domain = self.parsed_url.netloc
        self.path = self.parsed_url.path
        self.features = {}
        
    def extract_all_features(self):
        """Extract all 30 features and return as dictionary"""
        try:
            # Extract each feature
            self.features['having_IP_Address'] = self._having_ip_address()
            self.features['URL_Length'] = self._url_length()
            self.features['Shortining_Service'] = self._shortening_service()
            self.features['having_At_Symbol'] = self._having_at_symbol()
            self.features['double_slash_redirecting'] = self._double_slash_redirecting()
            self.features['Prefix_Suffix'] = self._prefix_suffix()
            self.features['having_Sub_Domain'] = self._having_sub_domain()
            self.features['SSLfinal_State'] = self._ssl_final_state()
            self.features['Domain_registeration_length'] = self._domain_registration_length()
            self.features['Favicon'] = self._favicon()
            self.features['port'] = self._port()
            self.features['HTTPS_token'] = self._https_token()
            self.features['Request_URL'] = self._request_url()
            self.features['URL_of_Anchor'] = self._url_of_anchor()
            self.features['Links_in_tags'] = self._links_in_tags()
            self.features['SFH'] = self._sfh()
            self.features['Submitting_to_email'] = self._submitting_to_email()
            self.features['Abnormal_URL'] = self._abnormal_url()
            self.features['Redirect'] = self._redirect()
            self.features['on_mouseover'] = self._on_mouseover()
            self.features['RightClick'] = self._right_click()
            self.features['popUpWidnow'] = self._popup_window()
            self.features['Iframe'] = self._iframe()
            self.features['age_of_domain'] = self._age_of_domain()
            self.features['DNSRecord'] = self._dns_record()
            self.features['web_traffic'] = self._web_traffic()
            self.features['Page_Rank'] = self._page_rank()
            self.features['Google_Index'] = self._google_index()
            self.features['Links_pointing_to_page'] = self._links_pointing_to_page()
            self.features['Statistical_report'] = self._statistical_report()
            
            return self.features
        except Exception as e:
            raise NetworkSecurityException(e, sys)
    
    # Feature extraction methods
    
    def _having_ip_address(self):
        """Check if URL has IP address instead of domain name"""
        try:
            # Check for IPv4
            ipv4_pattern = r'(([01]?\d\d?|2[0-4]\d|25[0-5])\.){3}([01]?\d\d?|2[0-4]\d|25[0-5])'
            # Check for IPv6
            ipv6_pattern = r'(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})'
            
            if re.search(ipv4_pattern, self.domain) or re.search(ipv6_pattern, self.domain):
                return -1  # Phishing
            return 1  # Legitimate
        except:
            return 0
    
    def _url_length(self):
        """Check URL length"""
        length = len(self.url)
        if length < 54:
            return 1  # Legitimate
        elif 54 <= length <= 75:
            return 0  # Suspicious
        return -1  # Phishing
    
    def _shortening_service(self):
        """Check if URL uses shortening service"""
        shortening_services = ['bit.ly', 'goo.gl', 'tinyurl', 't.co', 'ow.ly', 'is.gd', 'buff.ly']
        if any(service in self.domain for service in shortening_services):
            return -1  # Phishing
        return 1  # Legitimate
    
    def _having_at_symbol(self):
        """Check for @ symbol in URL"""
        if '@' in self.url:
            return -1  # Phishing
        return 1  # Legitimate
    
    def _double_slash_redirecting(self):
        """Check for // in path (not in protocol)"""
        if self.url.count('//') > 1:
            return -1  # Phishing
        return 1  # Legitimate
    
    def _prefix_suffix(self):
        """Check for - in domain"""
        if '-' in self.domain:
            return -1  # Phishing
        return 1  # Legitimate
    
    def _having_sub_domain(self):
        """Count number of subdomains"""
        dots = self.domain.count('.')
        if dots == 1:
            return 1  # Legitimate
        elif dots == 2:
            return 0  # Suspicious
        return -1  # Phishing (3+ dots)
    
    def _ssl_final_state(self):
        """Check SSL certificate"""
        try:
            if self.parsed_url.scheme == 'https':
                return 1  # Has SSL
            return -1  # No SSL
        except:
            return -1
    
    def _domain_registration_length(self):
        """Check domain registration length"""
        try:
            domain_info = whois.whois(self.domain)
            if domain_info.expiration_date:
                if isinstance(domain_info.expiration_date, list):
                    expiration = domain_info.expiration_date[0]
                else:
                    expiration = domain_info.expiration_date
                
                if isinstance(domain_info.creation_date, list):
                    creation = domain_info.creation_date[0]
                else:
                    creation = domain_info.creation_date
                
                age = (expiration - creation).days
                if age >= 365:
                    return 1  # Legitimate (1+ year)
                return -1  # Phishing
            return -1
        except:
            return -1
    
    def _favicon(self):
        """Check if favicon is loaded from external domain"""
        try:
            response = requests.get(self.url, timeout=5)
            soup = BeautifulSoup(response.content, 'html.parser')
            favicon = soup.find('link', rel='icon') or soup.find('link', rel='shortcut icon')
            
            if favicon and favicon.get('href'):
                favicon_url = favicon['href']
                if favicon_url.startswith('http') and self.domain not in favicon_url:
                    return -1  # External favicon - Phishing
            return 1  # Legitimate
        except:
            return 1
    
    def _port(self):
        """Check if non-standard port is used"""
        if self.parsed_url.port:
            if self.parsed_url.port not in [80, 443]:
                return -1  # Phishing
        return 1  # Legitimate
    
    def _https_token(self):
        """Check if 'https' appears in domain name"""
        if 'https' in self.domain.lower():
            return -1  # Phishing trick
        return 1  # Legitimate
    
    def _request_url(self):
        """Check percentage of external objects"""
        try:
            response = requests.get(self.url, timeout=5)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            total_objects = 0
            external_objects = 0
            
            for tag in soup.find_all(['img', 'video', 'audio']):
                src = tag.get('src', '')
                if src:
                    total_objects += 1
                    if src.startswith('http') and self.domain not in src:
                        external_objects += 1
            
            if total_objects == 0:
                return 1
            
            percentage = (external_objects / total_objects) * 100
            if percentage < 22:
                return 1  # Legitimate
            elif percentage <= 61:
                return 0  # Suspicious
            return -1  # Phishing
        except:
            return 1
    
    def _url_of_anchor(self):
        """Check anchors pointing to different domains"""
        try:
            response = requests.get(self.url, timeout=5)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            anchors = soup.find_all('a', href=True)
            if not anchors:
                return 1
            
            external_anchors = sum(1 for a in anchors if a['href'].startswith('http') and self.domain not in a['href'])
            percentage = (external_anchors / len(anchors)) * 100
            
            if percentage < 31:
                return 1  # Legitimate
            elif percentage <= 67:
                return 0  # Suspicious
            return -1  # Phishing
        except:
            return 1
    
    def _links_in_tags(self):
        """Check links in meta, script, and link tags"""
        try:
            response = requests.get(self.url, timeout=5)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            total = 0
            external = 0
            
            for tag in soup.find_all(['meta', 'script', 'link']):
                for attr in ['href', 'src']:
                    url = tag.get(attr, '')
                    if url and url.startswith('http'):
                        total += 1
                        if self.domain not in url:
                            external += 1
            
            if total == 0:
                return 1
            
            percentage = (external / total) * 100
            if percentage < 17:
                return 1
            elif percentage <= 81:
                return 0
            return -1
        except:
            return 1
    
    def _sfh(self):
        """Check Server Form Handler"""
        try:
            response = requests.get(self.url, timeout=5)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            forms = soup.find_all('form')
            for form in forms:
                action = form.get('action', '')
                if action == '' or action == 'about:blank':
                    return -1  # Phishing
                if action.startswith('http') and self.domain not in action:
                    return 0  # Suspicious
            return 1  # Legitimate
        except:
            return 1
    
    def _submitting_to_email(self):
        """Check if form submits to email"""
        try:
            response = requests.get(self.url, timeout=5)
            if 'mailto:' in response.text.lower():
                return -1  # Phishing
            return 1  # Legitimate
        except:
            return 1
    
    def _abnormal_url(self):
        """Check if URL is in WHOIS record"""
        try:
            domain_info = whois.whois(self.domain)
            if domain_info.domain_name:
                return 1  # Legitimate
            return -1  # Phishing
        except:
            return -1
    
    def _redirect(self):
        """Count number of redirects"""
        try:
            response = requests.get(self.url, timeout=5, allow_redirects=True)
            redirects = len(response.history)
            if redirects == 0:
                return 1
            elif redirects <= 2:
                return 0
            return -1
        except:
            return 0
    
    def _on_mouseover(self):
        """Check for onMouseOver to change status bar"""
        try:
            response = requests.get(self.url, timeout=5)
            if 'onmouseover' in response.text.lower():
                return -1  # Phishing
            return 1  # Legitimate
        except:
            return 1
    
    def _right_click(self):
        """Check if right-click is disabled"""
        try:
            response = requests.get(self.url, timeout=5)
            if 'event.button==2' in response.text or 'contextmenu' in response.text.lower():
                return -1  # Phishing
            return 1  # Legitimate
        except:
            return 1
    
    def _popup_window(self):
        """Check for popup windows with text fields"""
        try:
            response = requests.get(self.url, timeout=5)
            if 'window.open' in response.text or 'popup' in response.text.lower():
                return -1  # Phishing
            return 1  # Legitimate
        except:
            return 1
    
    def _iframe(self):
        """Check for iframe redirection"""
        try:
            response = requests.get(self.url, timeout=5)
            soup = BeautifulSoup(response.content, 'html.parser')
            if soup.find_all('iframe'):
                return -1  # Phishing
            return 1  # Legitimate
        except:
            return 1
    
    def _age_of_domain(self):
        """Check domain age"""
        try:
            domain_info = whois.whois(self.domain)
            if domain_info.creation_date:
                if isinstance(domain_info.creation_date, list):
                    creation_date = domain_info.creation_date[0]
                else:
                    creation_date = domain_info.creation_date
                
                age = (datetime.now() - creation_date).days
                if age >= 180:  # 6 months
                    return 1  # Legitimate
                return -1  # Phishing
            return -1
        except:
            return -1
    
    def _dns_record(self):
        """Check if DNS record exists"""
        try:
            socket.gethostbyname(self.domain)
            return 1  # Legitimate
        except:
            return -1  # Phishing
    
    def _web_traffic(self):
        """Simplified web traffic check"""
        # Note: Real implementation would use Alexa/Similar Web API
        # For now, return neutral
        return 0
    
    def _page_rank(self):
        """Simplified PageRank check"""
        # Note: Real implementation would use Google PageRank API
        # For now, return neutral
        return 0
    
    def _google_index(self):
        """Check if page is indexed by Google"""
        try:
            url = f"https://www.google.com/search?q=site:{self.domain}"
            response = requests.get(url, timeout=5)
            if "did not match any documents" in response.text:
                return -1  # Not indexed - Phishing
            return 1  # Indexed - Legitimate
        except:
            return 1
    
    def _links_pointing_to_page(self):
        """Simplified backlinks check"""
        # Note: Real implementation would use SEO API
        # For now, return neutral
        return 0
    
    def _statistical_report(self):
        """Check if domain is in phishing databases"""
        # Note: Real implementation would check PhishTank, OpenPhish etc.
        # For now, return neutral
        return 0
