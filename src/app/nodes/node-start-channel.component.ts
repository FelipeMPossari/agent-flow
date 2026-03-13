import { Component, Input, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NodeWrapperComponent } from './node-wrapper.component';

@Component({
    selector: 'app-node-start-channel',
    standalone: true,
    imports: [CommonModule, FormsModule, NodeWrapperComponent],
    template: `
    <app-node-wrapper [nodeId]="data?.id">
      
      <div class="node-header">
        <span class="icon">💬</span>
        <span class="title">Iniciar por um canal</span>
      </div>

      <div class="node-body">
        <label>Selecione um ou mais canais</label>
        
        <div class="custom-select-container" (mousedown)="$event.stopPropagation()">
            <div class="select-trigger" (click)="toggleDropdown()" [class.active]="isDropdownOpen">
              <span>{{ getSelectedChannelName() || 'Selecione' }}</span>
              <span class="arrow">▼</span>
            </div>

            <div class="dropdown-menu" *ngIf="isDropdownOpen">
                <div class="search-container">
                    <span class="search-icon">🔍</span>
                    <input type="text" [(ngModel)]="searchQuery" (click)="$event.stopPropagation()" placeholder="Pesquisar..." autocomplete="off">
                </div>
                <div class="options-list">
                    <div class="option" *ngFor="let channel of filteredChannels" (click)="selectChannel(channel.id)" [class.selected]="selectedChannel === channel.id">
                        {{ channel.name }}
                    </div>
                    <div class="no-results" *ngIf="filteredChannels.length === 0">Nenhum canal encontrado</div>
                </div>
            </div>
        </div>
      </div>

      <div class="node-footer warning" *ngIf="!selectedChannel">
        É necessário selecionar um canal
      </div>

    </app-node-wrapper>
  `,
    styles: [`
    * { box-sizing: border-box !important; }
    
    .node-header { padding: 16px 20px 8px 20px; display: flex; align-items: center; gap: 8px; }
    .icon { font-size: 16px; color: #52c41a; }
    .title { font-size: 13px; font-weight: 600; color: #52c41a; }
    
    .node-body { padding: 0 20px 10px 20px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
    label { font-size: 12px; color: #888; margin-bottom: 2px;}
    
    .custom-select-container { position: relative; width: 100%; }
    
    .select-trigger {
      background-color: #141517; color: #fff; border: 1px solid #33383d;
      padding: 8px 12px; border-radius: 20px; outline: none; width: 100%; font-size: 13px;
      cursor: pointer; display: flex; justify-content: space-between; align-items: center;
      transition: all 0.2s;
    }
    .select-trigger:hover, .select-trigger.active { border-color: #52c41a; }
    .arrow { font-size: 10px; color: #888; transition: transform 0.2s; }
    .select-trigger.active .arrow { transform: rotate(180deg); }

    .dropdown-menu {
      position: absolute; top: calc(100% + 5px); left: 0; width: 100%;
      background-color: #2a2e33; border: 1px solid #3a3f45; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 1000; overflow: hidden;
      display: flex; flex-direction: column; animation: slideDown 0.15s ease-out;
    }

    .search-container { display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid #3a3f45; background-color: #222529; }
    .search-icon { font-size: 12px; color: #888; margin-right: 8px; }
    .search-container input { background: transparent; border: none; outline: none; color: #fff; font-size: 13px; width: 100%; }

    .options-list { max-height: 120px; overflow-y: auto; }
    .options-list::-webkit-scrollbar { width: 4px; }
    .options-list::-webkit-scrollbar-thumb { background-color: #555; border-radius: 4px; }
    .option { padding: 10px 15px; font-size: 13px; cursor: pointer; color: #ccc; transition: background 0.2s; }
    .option:hover { background-color: #32373d; color: #fff; }
    .option.selected { color: #52c41a; font-weight: 600; background-color: rgba(82, 196, 26, 0.1); }
    .no-results { padding: 12px 15px; font-size: 12px; color: #888; text-align: center; }
    
    .node-footer.warning {
      background-color: #4a3618; color: #faad14; padding: 8px 15px; font-size: 11px; font-weight: 500;
      border-radius: 8px; margin: 0 20px 20px 20px; text-align: center;
    }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class NodeStartChannelComponent implements OnInit {
    @Input() data: any; // O X6 passa os dados do nó por aqui (incluindo o ID para o wrapper)

    selectedChannel: string = '';
    isDropdownOpen: boolean = false;
    searchQuery: string = '';

    availableChannels = [
        { id: 'whatsapp', name: 'WhatsApp' },
        { id: 'telegram', name: 'Telegram' },
        { id: 'web', name: 'Web Chat' },
        { id: 'instagram', name: 'Instagram' },
        { id: 'messenger', name: 'Messenger' }
    ];

    constructor(private eRef: ElementRef) { }

    ngOnInit() {
        if (this.data) {
            this.selectedChannel = this.data.config?.channel || '';
        }
    }

    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
        if (this.isDropdownOpen) this.searchQuery = '';
    }

    @HostListener('document:click', ['$event'])
    clickout(event: Event) {
        if (!this.eRef.nativeElement.contains(event.target)) {
            this.isDropdownOpen = false;
        }
    }

    getSelectedChannelName(): string {
        const channel = this.availableChannels.find(c => c.id === this.selectedChannel);
        return channel ? channel.name : '';
    }

    get filteredChannels() {
        if (!this.searchQuery) return this.availableChannels;
        return this.availableChannels.filter(c => c.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
    }

    selectChannel(channelId: string) {
        this.selectedChannel = channelId;
        this.isDropdownOpen = false;
        // Agora precisamos emitir um evento ou usar o FlowService se quiser atualizar o X6
        // Mas para manter a UI reativa, essa alteração local já é suficiente por agora.
    }
}