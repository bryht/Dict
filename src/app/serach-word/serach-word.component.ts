import { Component, OnInit, Input } from '@angular/core';
import { WordService } from '../word.service';
import Word from '../word.model';
import * as Mousetrap from 'mousetrap';
import { WebviewTag, webviewTag } from 'electron';
import { fail } from 'assert';
import { initConfig, getConfig, getDetail, configPara } from '../config';
import { BasicComponent } from '../basic/basic.component';
import { WSAEINVALIDPROVIDER } from 'constants';
import SuggestionWord from './search-word.model';
import WordFrequency from './wordsfrequency';

@Component({
  selector: 'app-serach-word',
  templateUrl: './serach-word.component.html',
  styleUrls: ['./serach-word.component.css']
})
export class SerachWordComponent implements OnInit {
  @Input() basicComponent: BasicComponent;
  settingImage = require('assets/settings.svg');
  words: Array<Word>;
  wordsSuggestion: Array<SuggestionWord>;
  constructor(private wordService: WordService) { }
  async ngOnInit() {
    this.getWords();
    window.onfocus = function () {
      const word = <HTMLInputElement>document.querySelector('#word');
      word.focus();
      word.value = '';
    };
    Mousetrap.bind(['command+f', 'ctrl+f'], function () {
      const word = <HTMLInputElement>document.querySelector('#word');
      word.focus();
      word.value = '';
    });
    Mousetrap.bind('j', function () {
      const webView = <WebviewTag>document.querySelector('div.collapse.show webview');
      if (webView != null) {
        webView.executeJavaScript('document.querySelector("body").scrollTop+=20', false);
      }
    });
    Mousetrap.bind('k', function () {
      const webView = <WebviewTag>document.querySelector('div.collapse.show webview');
      if (webView != null) {
        webView.executeJavaScript('document.querySelector("body").scrollTop-=20', false);
      }
    });
    Mousetrap.bind('J', function () {
      window.scrollTo(window.scrollX, window.scrollY + 20);
    });
    Mousetrap.bind('K', function () {
      window.scrollTo(window.scrollX, window.scrollY - 20);
    });
  }

  openSetting() {
    this.basicComponent.toggleSetting();
    window.scroll(0, 0);
  }
  async getWords() {
    this.words = await this.wordService.getAllWords();
  }
  deleteWord(id: string) {
    const card = document.querySelector('#card' + id);
    card.addEventListener('animationend', (e) => {
      this.wordService.deleteWord(id, this.words);
      this.wordService.updateWords(this.words);
    });
    card.classList.add('word-delete');
  }

  showWord(id: string, url: string) {
    const viewViewList = document.getElementsByTagName('webview');
    for (let index = 0; index < viewViewList.length; index++) {
      const element = viewViewList[index];
      element.remove();
    }
    const cardBody = document.getElementById('collapse' + id);
    const webView = document.createElement('webview');
    webView.id = 'web' + id;
    webView.autosize = 'on';
    webView.style.marginTop = '-100px';
    webView.style.height = '600px';
    webView.style.display = 'flex';
    webView.src = url;
    cardBody.appendChild(webView);
  }
  async searchWord(value: string, event: any) {
    const inputWord = value.trim();
    let word = await this.wordService.getLongmanWord(inputWord);
    if (word.soundUrl && configPara.default.playSound === 'true') {
      this.wordService.playSound(word.soundUrl);
    }
    word = this.wordService.insertWord(word, this.words);
    await this.wordService.updateWords(this.words);
    if (word.isPhrase === false) {
      // document.querySelector('#web' + word.id).setAttribute('src', word.url);
      // document.getElementById('web' + word.id).setAttribute('src', word.url);
      const showList = document.querySelectorAll('.show');
      for (let index = 0; index < showList.length; index++) {
        const element = showList[index];
        element.classList.remove('show');
      }
      document.querySelector('#collapse' + word.id).classList.add('show');
      this.showWord(word.id, word.url);
    }
    event.target.blur();
    this.wordsSuggestion = [];
  }

  wordInputChange(value: string, event: any) {
    if (value.length > 0) {
      var suggestions = WordFrequency.filter(p => p.indexOf(value) > -1).slice(0, 5);
      this.wordsSuggestion = suggestions.map(p => ({ word: p, isSelected: false }));
    } else {
      this.wordsSuggestion = [];
    }
  }

  wordInputSelect(value: string, event: any) {
    var selected = this.wordsSuggestion.filter(p => p.isSelected);
    var selectedIndex = 0;
    if (selected[0]) {
      selected[0].isSelected = false;
      var selectedIndex = this.wordsSuggestion.indexOf(selected[0]);
      if (selectedIndex < this.wordsSuggestion.length - 1) {
        selectedIndex++;
      } else if (selectedIndex == this.wordsSuggestion.length - 1) {
        selectedIndex = 0;
      }
    }
    this.wordsSuggestion[selectedIndex].isSelected = true;

    (document.getElementById('word') as HTMLInputElement).value = this.wordsSuggestion[selectedIndex].word;
  }
}
