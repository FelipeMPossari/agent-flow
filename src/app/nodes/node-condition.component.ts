import { Component, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '@antv/x6';
import { FlowService } from '../flow/flow.service';
import { NodeWrapperComponent } from './node-wrapper.component';

@Component({
    selector: 'app-node-condition',
    standalone: true,
    imports: [CommonModule, NodeWrapperComponent],
    template: `
    <app-node-wrapper>
        <div class="custom-node">
          
          <div class="node-header">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="10" width="6" height="4" rx="1"></rect>
              <rect x="15" y="4" width="6" height="4" rx="1"></rect>
              <rect x="15" y="16" width="6" height="4" rx="1"></rect>
              <path d="M9 12h3V6h3"></path>
              <path d="M12 12v6h3"></path>
            </svg>
            <span class="title">Definir condição</span>
          </div>

          <div class="node-body">
            
            <div class="condition-box">
              <span>Atende as condições</span>
              <div class="status-icon success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            </div>

            <div class="condition-box">
              <span>Não atende nenhuma das condições</span>
              <div class="status-icon error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
            </div>

            <button class="config-btn" (mousedown)="$event.stopPropagation()" (click)="configureCondition()">
              Configurar
            </button>
            
          </div>

          <div class="node-footer warning" *ngIf="!isConfigured">
            É necessário adicionar pelo menos uma condição em cada grupo.
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
    }
    
    .node-header { padding: 16px 20px 12px 20px; display: flex; align-items: center; gap: 8px; }
    .icon-svg { width: 18px; height: 18px; color: #e84e0f; } /* Cor laranjada/vermelha do ícone */
    .title { font-size: 13px; font-weight: 600; color: #8a919e; }
    
    .node-body { padding: 0 20px 10px 20px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
    
    /* --- CAIXAS DE SAÍDA --- */
    .condition-box {
      background-color: #1a1c1f;
      border: 1px solid #33383d;
      padding: 10px 15px;
      border-radius: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #9aa0a6;
    }

    .status-icon {
      width: 16px; height: 16px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .status-icon svg { width: 10px; height: 10px; }
    
    .status-icon.success { background-color: rgba(82, 196, 26, 0.15); color: #52c41a; }
    .status-icon.error { background-color: rgba(255, 77, 79, 0.15); color: #ff4d4f; }

    /* --- BOTÃO DE CONFIGURAR --- */
    .config-btn {
      background-color: transparent; color: #fff; border: 1px solid #33383d;
      padding: 8px 12px; border-radius: 20px; width: 100%; font-size: 13px;
      cursor: pointer; transition: all 0.2s; margin-top: 4px;
    }
    .config-btn:hover { background-color: #2a2e33; border-color: #8a919e; }

    .node-footer.warning {
      background-color: #4a3618; color: #faad14; padding: 10px 15px; font-size: 11px; font-weight: 500;
      border-radius: 12px; margin: 0 20px 20px 20px; line-height: 1.4;
    }
  `]
})
export class NodeConditionComponent implements OnInit {
    isConfigured: boolean = false;

    constructor(private eRef: ElementRef) { }

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
                this.isConfigured = data?.config?.isConfigured || false;
            }
        });
    }

    configureCondition() {
        // Lógica para abrir modal de configuração no futuro
        console.log('Abrir configuração de condições');
    }
}