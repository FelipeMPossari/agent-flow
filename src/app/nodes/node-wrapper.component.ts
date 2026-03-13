import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '@antv/x6';

@Component({
    selector: 'app-node-wrapper',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="custom-node-wrapper">
      
      <div class="node-toolbar">
        <button class="toolbar-btn copy-btn" (click)="copyNode($event)" title="Duplicar passo">
          <span class="icon">❐</span>
        </button>
        <button class="toolbar-btn delete-btn" (click)="deleteNode($event)" title="Excluir passo">
          <span class="icon">🗑️</span>
        </button>
      </div>

      <div class="node-content">
        <ng-content></ng-content>
      </div>
      
    </div>
  `,
    styles: [`
    :host { display: block; width: 100%; height: 100%; box-sizing: border-box; }
    * { box-sizing: border-box !important; }

    .custom-node-wrapper {
      width: 100%; height: 100%;
      position: relative; 
    }

    /* TOOLBAR */
    .node-toolbar {
      position: absolute;
      top: -45px; left: 0;
      background-color: #2a2e33;
      border: 1px solid #33383d;
      border-radius: 10px;
      display: flex; align-items: center; gap: 4px;
      padding: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      z-index: 1000;
      opacity: 0; visibility: hidden; transform: translateY(8px);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .custom-node-wrapper:hover .node-toolbar {
      opacity: 1; visibility: visible; transform: translateY(0);
    }
    
    .toolbar-btn {
      background: transparent; border: none;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; border-radius: 6px; transition: all 0.2s;
    }

    .toolbar-btn:hover { background-color: rgba(255, 255, 255, 0.08); }

    /* Estilização específica dos ícones */
    .copy-btn .icon { color: #888; font-size: 16px; }
    .copy-btn:hover .icon { color: #fff; }

    .delete-btn .icon { color: #ff4d4f; font-size: 16px; } /* Lixeira Vermelha */
    .delete-btn:hover { background-color: rgba(255, 77, 79, 0.15); }

    /* CONTEÚDO */
    .node-content {
      width: 100%; height: 100%;
      background-color: #222529; 
      border: 1px solid #33383d; 
      border-radius: 20px; 
      display: flex; flex-direction: column;
      box-shadow: 0 6px 16px rgba(0,0,0,0.25);
    }
  `]
})
export class NodeWrapperComponent {
    @Input() node!: Node;

    /**
     * Remove o nó do gráfico.
     * O X6 já cuida de remover as conexões (edges) ligadas a ele.
     */
    deleteNode(event: Event) {
        event.stopPropagation();
        if (this.node) {
            this.node.remove();
        }
    }

    /**
     * Clona o nó atual.
     * Usamos o model (graph) para adicionar o clone na mesma tela.
     */
    copyNode(event: Event) {
        event.stopPropagation();
        if (this.node && this.node.model) {
            const graph = this.node.model;
            const pos = this.node.getPosition();

            // Cria uma cópia exata (incluindo o 'data' com as configs do canal)
            const clone = this.node.clone();

            // Define a posição da cópia com um pequeno deslocamento (offset)
            clone.position(pos.x + 40, pos.y + 40);

            graph.addCell(clone);
        }
    }
}