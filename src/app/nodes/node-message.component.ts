import { Component, OnInit, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NodeWrapperComponent } from './node-wrapper.component';
import { Node } from '@antv/x6';
import { FlowService } from '../flow/flow.service';
import { ThemeService } from '../flow/theme.service';
import { SendMessageConfig } from '../flow/flow.models';

@Component({
    selector: 'app-node-message',
    standalone: true,
    imports: [CommonModule, FormsModule, NodeWrapperComponent],
    template: `
    <app-node-wrapper>
      <div class="custom-node" [class.dark-node]="(themeService.theme$ | async) === 'dark'">
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

          <!-- NOVA SEÇÃO: Toggle para Aguardar Resposta -->
          <div class="response-section" (mousedown)="$event.stopPropagation()">
            <div class="toggle-wrapper">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  [(ngModel)]="waitForResponse" 
                  (ngModelChange)="onWaitForResponseChange()"
                  class="checkbox-input">
                <span class="checkbox-text">Aguardar resposta do usuário</span>
              </label>
            </div>

            <!-- Dropdown de variáveis (visível apenas se waitForResponse for true) -->
            <div class="variable-selector" *ngIf="waitForResponse">
              <label class="select-label">Salvar resposta na variável</label>
              <select 
                [(ngModel)]="selectedVariable"
                (ngModelChange)="onVariableChange()"
                class="variable-dropdown">
                <option value="">-- Selecione uma variável --</option>
                <option *ngFor="let sysVar of systemVariables" [value]="sysVar">
                  {{ sysVar }}
                </option>
                <option value="__create_new">-- Criar nova variável... --</option>
              </select>

              <!-- Input de texto para nova variável (visível se "Criar nova variável" for selecionada) -->
              <div class="new-variable-input" *ngIf="selectedVariable === '__create_new'">
                <input 
                  type="text" 
                  [(ngModel)]="newVariableName"
                  (ngModelChange)="onNewVariableChange()"
                  placeholder="Digite o nome da nova variável"
                  class="text-input">
                <small class="hint">Ex: cor_favorita, idade, localidade</small>
              </div>
            </div>
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
    
    .custom-node { width: 100%; height: 100%; background-color: #222529; border: 1px solid #33383d; border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; color: #e0e0e0; font-family: 'Segoe UI', sans-serif; box-shadow: 0 6px 16px rgba(0,0,0,0.25); transition: background-color 0.3s, border-color 0.3s, color 0.3s, box-shadow 0.3s; }
    
    /* Light Theme */
    .custom-node:not(.dark-node) { background-color: #f9f9f9; border-color: #ddd; color: #333; box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
    
    .node-header { padding: 16px 20px 8px; display: flex; align-items: center; gap: 8px; }
    .icon-svg { width: 18px; height: 18px; color: #52c41a; }
    .title { font-size: 13px; font-weight: 600; color: #8a919e; transition: color 0.3s; }
    .custom-node:not(.dark-node) .title { color: #999; }
    
    .node-body { padding: 0 16px 16px; flex: 1; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
    .sub-header { display: flex; justify-content: space-between; align-items: center; padding: 0 4px; }
    .sub-header .label { font-size: 13px; color: #8a919e; transition: color 0.3s; }
    .custom-node:not(.dark-node) .sub-header .label { color: #999; }
    
    .actions { display: flex; gap: 12px; align-items: center; }
    .icon-btn { background: none; border: none; color: #8a919e; cursor: pointer; padding: 0; display: flex; align-items: center; transition: color 0.2s; }
    .icon-btn:hover { color: #fff; }
    .custom-node:not(.dark-node) .icon-btn { color: #999; }
    .custom-node:not(.dark-node) .icon-btn:hover { color: #333; }
    
    .icon-btn svg { width: 16px; height: 16px; }
    .icon-btn.font-icon { font-family: monospace; font-size: 15px; font-weight: bold; letter-spacing: -1px; }
    
    .attachment-chip { display: flex; align-items: center; background: #2a2e33; border-radius: 8px; padding: 8px 12px; margin: 0 4px 8px 4px; gap: 8px; border: 1px solid #3a3f45; transition: background-color 0.3s, border-color 0.3s; }
    .custom-node:not(.dark-node) .attachment-chip { background: #f0f0f0; border-color: #ddd; }
    
    .clip-icon { font-size: 14px; color: #1890ff; }
    .attach-name { font-size: 12px; color: #e0e0e0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: color 0.3s; }
    .custom-node:not(.dark-node) .attach-name { color: #333; }
    
    .attachment-chip .remove-btn { background: none; border: none; color: #8a919e; cursor: pointer; font-size: 18px; padding: 0 4px; line-height: 1; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: color 0.2s; }
    .attachment-chip .remove-btn:hover { color: #ff4d4f; background-color: rgba(255, 77, 79, 0.1); }

    .message-input-container { width: 100%; background-color: #1a1c1f; border: 1px solid #33383d; border-radius: 12px; display: flex; flex-direction: column; padding: 12px; flex: 1; transition: background-color 0.3s, border-color 0.3s; }
    .custom-node:not(.dark-node) .message-input-container { background-color: #f5f5f5; border-color: #ddd; }
    
    textarea { background: transparent; border: none; color: #e0e0e0; font-size: 13px; resize: none; outline: none; height: 100%; font-family: inherit; line-height: 1.4; transition: color 0.3s; }
    .custom-node:not(.dark-node) textarea { color: #333; }
    textarea::placeholder { color: #666; transition: color 0.3s; }
    .custom-node:not(.dark-node) textarea::placeholder { color: #999; }

    /* SEÇÃO DE RESPOSTA */
    .response-section { padding: 12px 8px; border-top: 1px solid #33383d; transition: border-color 0.3s; }
    .custom-node:not(.dark-node) .response-section { border-top-color: #ddd; }

    .toggle-wrapper { display: flex; align-items: center; margin-bottom: 8px; }

    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #e0e0e0; user-select: none; transition: color 0.3s; }
    .custom-node:not(.dark-node) .checkbox-label { color: #333; }

    .checkbox-input { cursor: pointer; width: 16px; height: 16px; accent-color: #1890ff; }

    .checkbox-text { transition: color 0.3s; }

    .variable-selector { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }

    .select-label { font-size: 12px; color: #8a919e; font-weight: 500; transition: color 0.3s; }
    .custom-node:not(.dark-node) .select-label { color: #999; }

    .variable-dropdown { 
      width: 100%; 
      padding: 8px 12px; 
      background-color: #1a1c1f; 
      border: 1px solid #33383d; 
      border-radius: 8px; 
      color: #e0e0e0; 
      font-size: 12px; 
      cursor: pointer; 
      transition: all 0.3s;
      font-family: inherit;
    }
    .variable-dropdown:hover { border-color: #5F95FF; }
    .variable-dropdown:focus { outline: none; border-color: #1890ff; box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2); }
    .custom-node:not(.dark-node) .variable-dropdown { background-color: #f5f5f5; border-color: #ddd; color: #333; }
    .custom-node:not(.dark-node) .variable-dropdown:hover { border-color: #1890ff; }
    .custom-node:not(.dark-node) .variable-dropdown:focus { box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15); }

    .new-variable-input { display: flex; flex-direction: column; gap: 6px; animation: slideDown 0.2s ease-out; }

    @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

    .text-input { 
      padding: 8px 12px; 
      background-color: #1a1c1f; 
      border: 1px solid #33383d; 
      border-radius: 8px; 
      color: #e0e0e0; 
      font-size: 12px; 
      transition: all 0.3s;
      font-family: inherit;
    }
    .text-input:hover { border-color: #5F95FF; }
    .text-input:focus { outline: none; border-color: #1890ff; box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2); }
    .custom-node:not(.dark-node) .text-input { background-color: #f5f5f5; border-color: #ddd; color: #333; }
    .custom-node:not(.dark-node) .text-input:hover { border-color: #1890ff; }
    .custom-node:not(.dark-node) .text-input:focus { box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15); }

    .hint { font-size: 11px; color: #666; transition: color 0.3s; margin-top: -2px; }
    .custom-node:not(.dark-node) .hint { color: #999; }
    
    .node-footer.warning { background-color: #4a3618; color: #faad14; padding: 10px 15px; font-size: 11px; font-weight: 500; border-radius: 12px; margin-top: 4px; line-height: 1.4; border: 1px solid rgba(250, 173, 20, 0.2); transition: background-color 0.3s, color 0.3s; }
    .custom-node:not(.dark-node) .node-footer.warning { background-color: #fff7e6; color: #d46b08; border-color: #ffd591; }
  `]
})
export class NodeMessageComponent implements OnInit {
    messageText: string = '';
    attachmentData: any = null;
    waitForResponse: boolean = false;
    selectedVariable: string = '';
    newVariableName: string = '';

    readonly systemVariables: string[] = ['sys_nome', 'sys_cpf', 'sys_telefone', 'sys_email'];

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
                // Carrega o estado inicial (útil quando você recarrega um fluxo salvo)
                const data = node.getData();
                const config: SendMessageConfig = data?.config || {};

                this.messageText = config.messageText || '';
                this.attachmentData = config.attachment || null;
                this.waitForResponse = config.waitForResponse || false;

                // Se houver uma variável salva, detectar se é customizada ou sistema
                if (config.variableName) {
                    if (this.systemVariables.includes(config.variableName)) {
                        this.selectedVariable = config.variableName;
                    } else {
                        this.selectedVariable = '__create_new';
                        this.newVariableName = config.variableName;
                    }
                }

                // Escuta mudanças em tempo real
                node.on('change:data', ({ current }) => {
                    const externalConfig: SendMessageConfig = current?.config || {};

                    const externalText = externalConfig.messageText || '';
                    if (this.messageText !== externalText) {
                        this.messageText = externalText;
                    }

                    const externalAttachment = externalConfig.attachment || null;
                    this.attachmentData = externalAttachment;

                    const externalWaitForResponse = externalConfig.waitForResponse || false;
                    if (this.waitForResponse !== externalWaitForResponse) {
                        this.waitForResponse = externalWaitForResponse;
                    }

                    if (externalConfig.variableName) {
                        if (this.systemVariables.includes(externalConfig.variableName)) {
                            this.selectedVariable = externalConfig.variableName;
                        } else {
                            this.selectedVariable = '__create_new';
                            this.newVariableName = externalConfig.variableName;
                        }
                    }

                    this.cdr.detectChanges();
                });
            }
        });
    }

    saveData() {
        const node = this.getNode();
        if (node) {
            const currentData = node.getData();
            const config: any = {
                messageText: this.messageText,
                attachment: this.attachmentData || undefined,
                waitForResponse: this.waitForResponse,
                variableName: this.getVariableName() || undefined
            };
            node.setData({ ...currentData, config }, { overwrite: true });
        }
    }

    onWaitForResponseChange() {
        // Reset das variáveis quando desmarca
        if (!this.waitForResponse) {
            this.selectedVariable = '';
            this.newVariableName = '';
        }
        this.saveData();
    }

    onVariableChange() {
        // Reset do campo de nova variável se selecionou algo predefinido
        if (this.selectedVariable !== '__create_new') {
            this.newVariableName = '';
        }
        this.saveData();
    }

    onNewVariableChange() {
        this.saveData();
    }

    private getVariableName(): string | undefined {
        if (!this.waitForResponse) return undefined;

        if (this.selectedVariable === '__create_new') {
            return this.newVariableName.trim() || undefined;
        }

        return this.selectedVariable || undefined;
    }

    removeAttachment() {
        const node = this.getNode();
        if (node) {
            const currentData = node.getData();
            const config: SendMessageConfig = { ...currentData.config };
            config.attachment = undefined;
            node.setData({ ...currentData, config });
        }
    }

    openVariables(event: MouseEvent) {
        event.stopPropagation();
        const node = this.getNode();
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        if (node && FlowService.graph) {
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