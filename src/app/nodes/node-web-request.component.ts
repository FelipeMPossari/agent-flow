import { Component, OnInit, ElementRef, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '@antv/x6';
import { FlowService } from '../flow/flow.service';
import { ThemeService } from '../flow/theme.service';
import { NodeWrapperComponent } from './node-wrapper.component';

@Component({
    selector: 'app-node-web-request',
    standalone: true,
    imports: [CommonModule, NodeWrapperComponent],
    template: `
    <app-node-wrapper>
        <div class="custom-node" [class.dark-node]="(themeService.theme$ | async) === 'dark'">
          
          <div class="node-header">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <path d="M19.07 4.93L16.94 7.05M7.05 16.94l2.12 2.12M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83"></path>
            </svg>
            <span class="title">Requisição Web</span>
          </div>

          <div class="node-body">
            <!-- Exibir configuração salva -->
            <div *ngIf="isConfigured && config" class="config-display">
              <div class="config-item">
                <span class="config-label">Endpoint:</span>
                <span class="config-value" [title]="config.endpoint">{{ config.endpoint | slice:0:40 }}{{ config.endpoint?.length > 40 ? '...' : '' }}</span>
              </div>
              <div class="config-item">
                <span class="config-label">Método:</span>
                <span class="config-value">{{ config.method }}</span>
              </div>
            </div>

            <!-- Fallback se não houver configuração -->
            <div *ngIf="!isConfigured" class="config-box">
              <span>Clique em "Configurar" para definir a requisição</span>
            </div>

            <button class="config-btn" (mousedown)="$event.stopPropagation()" (click)="configureWebRequest()">
              Configurar
            </button>
            
          </div>

          <!-- SAÍDAS DO NÓ -->
          <div class="node-outputs">
            <div class="output-badge success">
              <span class="output-label">Sucesso</span>
              <span class="output-dot" #successDot></span>
            </div>
            <div class="output-badge failure">
              <span class="output-label">Falha</span>
              <span class="output-dot" #failureDot></span>
            </div>
          </div>

          <div class="node-footer warning" *ngIf="!isConfigured">
            Configurar endpoint e método
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
      transition: background-color 0.3s, border-color 0.3s, color 0.3s, box-shadow 0.3s;
    }
    
    /* Light Theme */
    .custom-node:not(.dark-node) { background-color: #f9f9f9; border-color: #ddd; color: #333; box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
    
    .node-header { padding: 16px 20px 12px 20px; display: flex; align-items: center; gap: 8px; }
    .icon-svg { width: 18px; height: 18px; color: #1890ff; }
    .title { font-size: 13px; font-weight: 600; color: #8a919e; transition: color 0.3s; }
    .custom-node:not(.dark-node) .title { color: #999; }
    
    .node-body { padding: 0 20px 10px 20px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
    
    .config-display { display: flex; flex-direction: column; gap: 6px; }
    
    .config-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 8px 12px;
      background-color: #1a1c1f;
      border: 1px solid #33383d;
      border-radius: 12px;
      transition: background-color 0.3s, border-color 0.3s;
    }
    .custom-node:not(.dark-node) .config-item { background-color: #f5f5f5; border-color: #ddd; }

    .config-label {
      font-size: 11px;
      font-weight: 600;
      color: #8a919e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: color 0.3s;
    }
    .custom-node:not(.dark-node) .config-label { color: #999; }

    .config-value {
      font-size: 12px;
      color: #e0e0e0;
      font-weight: 500;
      transition: color 0.3s;
    }
    .custom-node:not(.dark-node) .config-value { color: #333; }

    .config-box {
      background-color: #1a1c1f;
      border: 1px solid #33383d;
      padding: 10px 15px;
      border-radius: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #9aa0a6;
      transition: background-color 0.3s, border-color 0.3s, color 0.3s;
    }
    .custom-node:not(.dark-node) .config-box { background-color: #f5f5f5; border-color: #ddd; color: #666; }

    .config-btn {
      background-color: transparent; color: #fff; border: 1px solid #33383d;
      padding: 8px 12px; border-radius: 20px; width: 100%; font-size: 13px;
      cursor: pointer; transition: all 0.2s; margin-top: 4px;
    }
    .custom-node:not(.dark-node) .config-btn { color: #333; border-color: #ddd; }
    .custom-node:not(.dark-node) .config-btn:hover { background-color: #f0f0f0; border-color: #999; }
    
    .config-btn:hover { background-color: #2a2e33; border-color: #8a919e; }

    .node-footer.warning {
      background-color: #4a3618; color: #faad14; padding: 6px 12px; font-size: 11px; font-weight: 500;
      border-radius: 12px; margin: 0 20px 16px 20px; line-height: 1.3; transition: background-color 0.3s, color 0.3s;
    }
    .custom-node:not(.dark-node) .node-footer.warning { background-color: #fff7e6; color: #d46b08; }

    /* SAÍDAS DO NÓ */
    .node-outputs {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 20px 16px 20px;
      border-top: 1px solid #33383d;
      margin-top: auto;
    }
    .custom-node:not(.dark-node) .node-outputs { border-top-color: #ddd; }

    .output-badge {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid transparent;
      transition: all 0.2s;
    }

    .output-badge.success {
      background-color: rgba(82, 196, 26, 0.15);
      border-color: #52c41a;
      color: #52c41a;
    }

    .output-badge.failure {
      background-color: rgba(255, 77, 79, 0.15);
      border-color: #ff4d4f;
      color: #ff4d4f;
    }

    .custom-node:not(.dark-node) .output-badge.success {
      background-color: #f6ffed;
      border-color: #b7eb8f;
    }

    .custom-node:not(.dark-node) .output-badge.failure {
      background-color: #fff1f0;
      border-color: #ffccc7;
    }

    .output-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    .output-badge.success .output-dot {
      background-color: #52c41a;
      box-shadow: 0 0 6px rgba(82, 196, 26, 0.5);
    }

    .output-badge.failure .output-dot {
      background-color: #ff4d4f;
      box-shadow: 0 0 6px rgba(255, 77, 79, 0.5);
    }

    .output-label {
      color: inherit;
      transition: color 0.3s;
    }
  `]
})
export class NodeWebRequestComponent implements OnInit {
    isConfigured: boolean = false;
    config: any = null;

    @ViewChild('successDot', { static: false }) successDot?: ElementRef;
    @ViewChild('failureDot', { static: false }) failureDot?: ElementRef;

    constructor(private eRef: ElementRef, private cdr: ChangeDetectorRef, public themeService: ThemeService) { }

    private getNode(): Node | null {
        if (!FlowService.graph) return null;
        const view = FlowService.graph.findViewByElem(this.eRef.nativeElement);
        return view ? view.cell as Node : null;
    }

    ngOnInit() {
        setTimeout(() => {
            const node = this.getNode();
            if (node) {
                this.loadWebRequestData(node);

                // Escuta mudanças nos dados do nó
                node.on('change:data', ({ current }) => {
                    this.loadWebRequestData(node);
                });
            }
        });
    }

    private loadWebRequestData(node: Node) {
        const data = node.getData();
        this.config = data?.config || null;
        this.isConfigured = data?.config?.isConfigured || false;

        this.cdr.detectChanges();

        // Sincroniza as portas (Success e Failure) após renderização
        setTimeout(() => {
            this.syncPorts(node);
        });
    }

    private syncPorts(node: Node) {
        if (!node) return;

        // Remove todas as portas de saída existentes (exceto 'in')
        const existingOutPorts = node.getPortsByGroup('out-absolute')
            .map(p => p.id)
            .filter((id): id is string => Boolean(id));

        existingOutPorts.forEach(portId => {
            node.removePort(portId);
        });

        let successY = 245;
        let failureY = 290;

        if (this.successDot && this.failureDot) {
            const rootRect = this.eRef.nativeElement.getBoundingClientRect();
            const successRect = this.successDot.nativeElement.getBoundingClientRect();
            const failureRect = this.failureDot.nativeElement.getBoundingClientRect();

            successY = successRect.top - rootRect.top + (successRect.height / 2);
            failureY = failureRect.top - rootRect.top + (failureRect.height / 2);
        } else {
            // Fallback baseado no estado
            successY = this.isConfigured ? 255 : 210;
            failureY = this.isConfigured ? 295 : 250;
        }

        // Adiciona as duas portas: Success e Failure
        node.addPort({
            id: 'success',
            group: 'out-absolute',
            args: {
                x: 280,
                y: successY
            }
        });

        node.addPort({
            id: 'failure',
            group: 'out-absolute',
            args: {
                x: 280,
                y: failureY
            }
        });
    }

    configureWebRequest() {
        const node = this.getNode();
        if (node && FlowService.graph) {
            FlowService.graph.trigger('modal:web-request:open', { node });
        }
    }
}
