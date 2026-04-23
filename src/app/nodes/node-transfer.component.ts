import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Node } from '@antv/x6';
import { FlowService } from '../flow/flow.service';
import { ThemeService } from '../flow/theme.service';
import { NodeWrapperComponent } from './node-wrapper.component';

@Component({
    selector: 'app-node-transfer',
    standalone: true,
    imports: [CommonModule, FormsModule, NodeWrapperComponent],
    template: `
    <app-node-wrapper>
        
        <div class="custom-node" [class.dark-node]="(themeService.theme$ | async) === 'dark'">
          <div class="node-header">
            <span class="icon">🔁</span>
            <span class="title">Transferir de Setor</span>
          </div>

          <div class="node-body">
            <label>Selecione um setor de destino</label>
            
            <div class="custom-select-container" (mousedown)="$event.stopPropagation()">
                <div class="select-trigger" (click)="toggleDropdown()" [class.active]="isDropdownOpen">
                  <span>{{ getSelectedDepartmentName() || 'Selecione o setor' }}</span>
                  <span class="arrow">▼</span>
                </div>

                <div class="dropdown-menu" *ngIf="isDropdownOpen">
                    <div class="search-container">
                        <span class="search-icon">🔍</span>
                        <input type="text" [(ngModel)]="searchQuery" (click)="$event.stopPropagation()" placeholder="Pesquisar setor..." autocomplete="off">
                    </div>
                    <div class="options-list">
                        <div class="option" *ngFor="let dept of filteredDepartments" (click)="selectDepartment(dept.id)" [class.selected]="selectedDepartment === dept.id">
                            {{ dept.name }}
                        </div>
                        <div class="no-results" *ngIf="filteredDepartments.length === 0">Nenhum setor encontrado</div>
                    </div>
                </div>
            </div>
          </div>

          <div class="node-footer warning" *ngIf="!selectedDepartment">
            É necessário selecionar um setor
          </div>
        </div>

    </app-node-wrapper>
  `,
    styles: [`
    :host { display: block; width: 100%; height: 100%; box-sizing: border-box; }
    * { box-sizing: border-box !important; }

    .custom-node {
      width: 100%; height: 100%;
      background-color: #222529; 
      border: 1px solid #33383d; 
      border-radius: 20px; 
      display: flex; flex-direction: column;
      color: #e0e0e0; font-family: 'Segoe UI', sans-serif;
      box-shadow: 0 6px 16px rgba(0,0,0,0.25);
      position: relative;
      transition: background-color 0.3s, border-color 0.3s, color 0.3s, box-shadow 0.3s;
    }
    
    /* Light Theme */
    .custom-node:not(.dark-node) { background-color: #f9f9f9; border-color: #ddd; color: #333; box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
    
    .node-header { padding: 16px 20px 8px 20px; display: flex; align-items: center; gap: 8px; }
    .icon { font-size: 16px; color: #1890ff; }
    .title { font-size: 13px; font-weight: 600; color: #1890ff; }
    
    .node-body { padding: 0 20px 10px 20px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
    label { font-size: 12px; color: #888; margin-bottom: 2px; transition: color 0.3s; }
    .custom-node:not(.dark-node) label { color: #999; }
    
    .custom-select-container { position: relative; width: 100%; }
    
    .select-trigger {
      background-color: #141517; color: #fff; border: 1px solid #33383d;
      padding: 8px 12px; border-radius: 20px; outline: none; width: 100%; font-size: 13px;
      cursor: pointer; display: flex; justify-content: space-between; align-items: center;
      transition: all 0.2s;
    }
    .custom-node:not(.dark-node) .select-trigger { background-color: #f5f5f5; color: #333; border-color: #ddd; }
    
    .select-trigger:hover, .select-trigger.active { border-color: #1890ff; }
    .arrow { font-size: 10px; color: #888; transition: transform 0.2s; }
    .select-trigger.active .arrow { transform: rotate(180deg); }

    .dropdown-menu {
      position: absolute; top: calc(100% + 5px); left: 0; width: 100%;
      background-color: #2a2e33; border: 1px solid #3a3f45; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 1000; overflow: hidden;
      display: flex; flex-direction: column; animation: slideDown 0.15s ease-out;
      transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
    }
    .custom-node:not(.dark-node) .dropdown-menu { background-color: #fff; border-color: #ddd; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }

    .search-container { display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid #3a3f45; background-color: #222529; transition: border-color 0.3s, background-color 0.3s; }
    .custom-node:not(.dark-node) .search-container { border-bottom-color: #ddd; background-color: #f9f9f9; }
    
    .search-icon { font-size: 12px; color: #888; margin-right: 8px; }
    .search-container input { background: transparent; border: none; outline: none; color: #fff; font-size: 13px; width: 100%; transition: color 0.3s; }
    .custom-node:not(.dark-node) .search-container input { color: #333; }
    .search-container input::placeholder { color: #666; transition: color 0.3s; }
    .custom-node:not(.dark-node) .search-container input::placeholder { color: #999; }

    .options-list { max-height: 120px; overflow-y: auto; }
    .options-list::-webkit-scrollbar { width: 4px; }
    .options-list::-webkit-scrollbar-thumb { background-color: #555; border-radius: 4px; }
    .custom-node:not(.dark-node) .options-list::-webkit-scrollbar-thumb { background-color: #ddd; }
    
    .option { padding: 10px 15px; font-size: 13px; cursor: pointer; color: #ccc; transition: background 0.2s, color 0.2s; }
    .custom-node:not(.dark-node) .option { color: #666; }
    
    .option:hover { background-color: #32373d; color: #fff; }
    .custom-node:not(.dark-node) .option:hover { background-color: #f5f5f5; color: #333; }
    
    .option.selected { color: #1890ff; font-weight: 600; background-color: rgba(24, 144, 255, 0.1); }
    .no-results { padding: 12px 15px; font-size: 12px; color: #888; text-align: center; transition: color 0.3s; }
    .custom-node:not(.dark-node) .no-results { color: #999; }
    
    .node-footer.warning {
      background-color: #4a3618; color: #faad14; padding: 8px 15px; font-size: 11px; font-weight: 500;
      border-radius: 8px; margin: 0 20px 20px 20px; text-align: center; transition: background-color 0.3s, color 0.3s;
    }
    .custom-node:not(.dark-node) .node-footer.warning { background-color: #fff7e6; color: #d46b08; }
    
    @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class NodeTransferComponent implements OnInit {
    selectedDepartment: string = '';
    isDropdownOpen: boolean = false;
    searchQuery: string = '';

    availableDepartments = [
        { id: 'vendas', name: 'Vendas' },
        { id: 'suporte', name: 'Suporte Técnico' },
        { id: 'financeiro', name: 'Financeiro' },
        { id: 'rh', name: 'Recursos Humanos' },
        { id: 'marketing', name: 'Marketing' }
    ];

    constructor(private eRef: ElementRef, public themeService: ThemeService) { }

    private getNode(): Node | null {
        if (!FlowService.graph) return null;
        const view = FlowService.graph.findViewByElem(this.eRef.nativeElement);
        return view ? view.cell as Node : null;
    }

    ngOnInit() {
        setTimeout(() => {
            const node = this.getNode();
            if (node) {
                const data = node.getData();
                this.selectedDepartment = data?.config?.department || '';
            }
        });
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

    getSelectedDepartmentName(): string {
        const dept = this.availableDepartments.find(d => d.id === this.selectedDepartment);
        return dept ? dept.name : '';
    }

    get filteredDepartments() {
        if (!this.searchQuery) return this.availableDepartments;
        return this.availableDepartments.filter(d => d.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
    }

    selectDepartment(departmentId: string) {
        this.selectedDepartment = departmentId;
        this.isDropdownOpen = false;

        const node = this.getNode();
        if (node) {
            const currentData = node.getData();
            node.setData({
                ...currentData,
                config: { ...currentData.config, department: departmentId }
            }, { overwrite: true });
        }
    }
}