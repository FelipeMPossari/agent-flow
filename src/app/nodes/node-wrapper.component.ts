import { Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '@antv/x6';
import { FlowService } from '../flow/flow.service';
import { ThemeService } from '../flow/theme.service';

@Component({
    selector: 'app-node-wrapper',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="custom-node-wrapper" [class.dark-wrapper]="(themeService.theme$ | async) === 'dark'">
      
      <div class="node-toolbar" (mousedown)="$event.stopPropagation(); $event.preventDefault()">
        <button class="toolbar-btn copy-btn" (click)="copyNode($event)" title="Duplicar">
          <span class="icon">❐</span>
        </button>
        <button class="toolbar-btn delete-btn" (click)="deleteNode($event)" title="Excluir">
          <span class="icon">🗑️</span>
        </button>
      </div>

      <div class="node-content">
        <ng-content></ng-content>
      </div>
      
    </div>
  `,
    styles: [`
    * { box-sizing: border-box !important; }
    :host { display: block; width: 100%; height: 100%; }

    .custom-node-wrapper { 
        width: 100%; height: 100%; position: relative; 
    }

    /* --- ESTILO DA PÍLULA FLUTUANTE --- */
    .node-toolbar {
      position: absolute;
      top: -46px; 
      left: 3px; 
      background-color: #1e2126;
      border: 1px solid #33383d;
      border-radius: 12px;
      display: flex; 
      align-items: center; 
      gap: 4px;
      padding: 4px;
      z-index: 1000;
      opacity: 0; 
      visibility: hidden; 
      transform: translateY(4px);
      transition: all 0.2s ease-in-out;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    /* Light Theme */
    .custom-node-wrapper:not(.dark-wrapper) .node-toolbar { 
      background-color: #fff; 
      border-color: #ddd;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .custom-node-wrapper:hover .node-toolbar { 
        opacity: 1; 
        visibility: visible; 
        transform: translateY(0);
    }
    
    .toolbar-btn { 
      background: transparent; 
      border: none; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      width: 32px; 
      height: 32px; 
      border-radius: 8px;
      padding: 0;
      transition: all 0.2s;
    }

    .copy-btn .icon { color: #8a919e; font-size: 15px; }
    .custom-node-wrapper:not(.dark-wrapper) .copy-btn .icon { color: #999; }
    
    .delete-btn .icon { color: #e57373; font-size: 15px; } 

    .copy-btn:hover { 
        background-color: #383d44;
    }
    .custom-node-wrapper:not(.dark-wrapper) .copy-btn:hover { 
        background-color: #f0f0f0;
    }
    
    .copy-btn:hover .icon { 
        color: #ffffff;
    }
    .custom-node-wrapper:not(.dark-wrapper) .copy-btn:hover .icon {
        color: #333;
    }

    .delete-btn:hover { 
        background-color: #ff4d4f;
    }

    .node-content { 
        width: 100%; height: 100%; 
        border-radius: 20px; 
    }
  `]
})
export class NodeWrapperComponent {

    constructor(private eRef: ElementRef, public themeService: ThemeService) { }

    private getNode(): Node | null {
        if (!FlowService.graph) return null;
        const view = FlowService.graph.findViewByElem(this.eRef.nativeElement);
        return view ? view.cell as Node : null;
    }

    deleteNode(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const node = this.getNode();
        if (node) {
            node.remove();
        } else {
            console.error('Wrapper não encontrou o nó no X6');
        }
    }

    copyNode(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const node = this.getNode();
        if (node && FlowService.graph) {
            const clone = node.clone();
            const pos = node.getPosition();
            clone.position(pos.x + 40, pos.y + 40);
            FlowService.graph.addNode(clone);
        }
    }
}