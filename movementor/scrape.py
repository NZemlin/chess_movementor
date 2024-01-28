from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
import undetected_chromedriver as uc
import chess, chess.pgn
import time
import io
if __name__ == '__main__':
    from utils.parse import PGNParser
    from utils.write import PGNWriter
else:
    from .utils.parse import PGNParser
    from .utils.write import PGNWriter

class PGNScraper():
    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.chromeOptions = uc.ChromeOptions()
        self.chromeOptions.add_argument('--headless=new')
        self.chromeOptions.add_experimental_option('excludeSwitches', ['enable-logging'])
        self.driver = webdriver.Chrome(options=self.chromeOptions)
        self.driver.get('https://www.chess.com/login_and_go?returnUrl=https://www.chess.com/')
        self.pgn_dict = {}
        self.parsed_dict = {}
        self.populate_dicts()
        self.writer = PGNWriter(self.parsed_dict)
        
    def login_and_retrieve_analyses(self):
            uname = self.driver.find_element(By.ID, "username")
            uname.send_keys(self.username)
            password = self.driver.find_element(By.ID, "password")
            password.send_keys(self.password)
            self.driver.find_element(By.NAME, "login").click()
            time.sleep(2)
            self.driver.get('https://www.chess.com/analysis/saved')
            time.sleep(2)

    def scrape_analyses(self):
        content = self.driver.page_source
        soup = BeautifulSoup(content, features='lxml')
        for analysis in soup.findAll(attrs={'class': 'saved-analysis-item-component'}):
            name = analysis.find('a')
            pgn = analysis.find('p')
            self.pgn_dict[name.text] = chess.pgn.read_game(io.StringIO(pgn.text))
        self.driver.close()

    def populate_dicts(self):
        self.login_and_retrieve_analyses()
        self.scrape_analyses()
        for k, v in self.pgn_dict.items():
            p = PGNParser(v, [])
            self.parsed_dict[k] = p.move_list