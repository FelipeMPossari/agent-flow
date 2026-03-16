import { Component, OnInit, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NodeWrapperComponent } from './node-wrapper.component';
import { Node } from '@antv/x6';
import { FlowService } from '../flow/flow.service';

@Component({
    selector: 'app-node-message',
    standalone: true,
    imports: [CommonModule, FormsModule, NodeWrapperComponent],
    template: `
    <app-node-wrapper>
      <div class="custom-node">
        <div class="node-header">
          <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="title">Enviar mensagem</span>
        </div>

        <div class="node-body">
          <div class="sub-header">
            <span class="label">Mensagem</span>
            <div class="actions">
              <button class="icon-btn" (click)="openAttachment($event)" title="Anexar arquivo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
              
              <button class="icon-btn font-icon" (click)="openVariables($event)" title="Inserir Variável">
                {{ '{}' }}
              </button>
            </div>
          </div>

          <div class="attachment-chip" *ngIf="attachmentData">
            <span class="clip-icon">📎</span>
            <span class="attach-name" [title]="attachmentData.name">{{ attachmentData.name }}</span>
            <button class="remove-btn" (click)="removeAttachment()" title="Remover anexo">×</button>
          </div>

          <div class="message-input-container" (mousedown)="$event.stopPropagation()">
             <textarea 
               [(ngModel)]="messageText"
               (ngModelChange)="saveData()"
               placeholder="Digite aqui a mensagem que será enviada pelo bot.">
             </textarea>
          </div>

          <div class="node-footer warning" *ngIf="!messageText && !attachmentData">
            É obrigatório uma mensagem ou mídia
          </div>
        </div>
      </div>
    </app-node-wrapper>
  `,
    styles: [`
    :host { display: block; width: 100%; height: 100%; }
    * { box-sizing: border-box !important; }
    .custom-node { width: 100%; height: 100%; background-color: #222529; border: 1px solid #33383d; border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; color: #e0e0e0; font-family: 'Segoe UI', sans-serif; box-shadow: 0 6px 16px rgba(0,0,0,0.25); }
    .node-header { padding: 16px 20px 8px; display: flex; align-items: center; gap: 8px; }
    .icon-svg { width: 18px; height: 18px; color: #52c41a; }
    .title { font-size: 13px; font-weight: 600; color: #8a919e; }
    .node-body { padding: 0 16px 16px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .sub-header { display: flex; justify-content: space-between; align-items: center; padding: 0 4px; }
    .sub-header .label { font-size: 13px; color: #8a919e; }
    .actions { display: flex; gap: 12px; align-items: center; }
    .icon-btn { background: none; border: none; color: #8a919e; cursor: pointer; padding: 0; display: flex; align-items: center; transition: color 0.2s; }
    .icon-btn:hover { color: #fff; }
    .icon-btn svg { width: 16px; height: 16px; }
    .icon-btn.font-icon { font-family: monospace; font-size: 15px; font-weight: bold; letter-spacing: -1px; }
    
    /* Estilos do Chip de Anexo */
    .attachment-chip { display: flex; align-items: center; background: #2a2e33; border-radius: 8px; padding: 8px 12px; margin: 0 4px 8px 4px; gap: 8px; border: 1px solid #3a3f45; }
    .clip-icon { font-size: 14px; color: #1890ff; }
    .attach-name { font-size: 12px; color: #e0e0e0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .attachment-chip .remove-btn { background: none; border: none; color: #8a919e; cursor: pointer; font-size: 18px; padding: 0 4px; line-height: 1; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
    .attachment-chip .remove-btn:hover { color: #ff4d4f; background-color: rgba(255, 77, 79, 0.1); }

    .message-input-container { width: 100%; background-color: #1a1c1f; border: 1px solid #33383d; border-radius: 12px; display: flex; flex-direction: column; padding: 12px; flex: 1; }
    textarea { background: transparent; border: none; color: #e0e0e0; font-size: 13px; resize: none; outline: none; height: 100%; font-family: inherit; line-height: 1.4; }
    .node-footer.warning { background-color: #4a3618; color: #faad14; padding: 10px 15px; font-size: 11px; font-weight: 500; border-radius: 12px; margin-top: 4px; line-height: 1.4; border: 1px solid rgba(250, 173, 20, 0.2); }
  `]
})
export class NodeMessageComponent implements OnInit {
    messageText: string = '';
    attachmentData: any = null;

    constructor(private eRef: ElementRef, private cdr: ChangeDetectorRef) { }

    private getNode(): Node | null {
        if (!FlowService.graph) return null;
        const view = FlowService.graph.findViewByElem(this.eRef.nativeElement);
        return view ? view.cell as Node : null;
    }

    ngOnInit() {
        setTimeout(() => {
            const node = this.getNode();
            if (node) {
                // Carrega o estado inicial (útil quando você recarrega um fluxo salvo)
                const data = node.getData();
                this.messageText = data?.config?.messageText || '';
                this.attachmentData = data?.config?.attachment || null;

                // Escuta mudanças em tempo real
                node.on('change:data', ({ current }) => {
                    // Atualiza o texto
                    const externalText = current?.config?.messageText || '';
                    if (this.messageText !== externalText) {
                        this.messageText = externalText;
                    }

                    // ATUALIZA O ANEXO
                    const externalAttachment = current?.config?.attachment || null;
                    this.attachmentData = externalAttachment;

                    this.cdr.detectChanges(); // Força a tela a atualizar
                });
            }
        });
    }

    saveData() {
        const node = this.getNode();
        if (node) {
            const currentData = node.getData();
            node.setData({ ...currentData, config: { ...currentData.config, messageText: this.messageText } });
        }
    }

    removeAttachment() {
        const node = this.getNode();
        if (node) {
            const currentData = node.getData();
            node.setData({ ...currentData, config: { ...currentData.config, attachment: null } });
        }
    }

    openVariables(event: MouseEvent) {
        event.stopPropagation();
        const node = this.getNode();
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        if (node && FlowService.graph) {
            // Disparamos o evento avisando onde o botão foi clicado na tela
            FlowService.graph.trigger('modal:variables:open', { node, x: rect.right + 15, y: rect.top - 10 });
        }
    }

    openAttachment(event: MouseEvent) {
        event.stopPropagation();
        const node = this.getNode();
        if (node && FlowService.graph) {
            FlowService.graph.trigger('modal:attachment:open', { node });
        }
    }
}