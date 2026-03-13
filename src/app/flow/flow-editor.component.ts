import {
    Component, AfterViewInit, ViewChild, ElementRef,
    HostListener, NgZone, ChangeDetectorRef, Input, Output, EventEmitter, SimpleChanges,
    Injector
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Graph, Cell, Node } from '@antv/x6'; // <-- Adicionamos o Node aqui
import { register } from '@antv/x6-angular-shape';

import * as Models from './flow.models';
import { getGraphOptions, validateConnectionRule } from './flow-graph.config';
import { FlowUtils } from './flow.utils';
import { FlowService } from './flow.service';
import { getNodeConfig, REGISTERED_NODES } from './flow-nodes.config';

@Component({
    selector: 'app-flow-editor',
    standalone: true,
    imports: [CommonModule, FormsModule], // O Angular reclamou desse cara aqui
    templateUrl: './flow-editor.component.html',
    styleUrls: ['./flow-editor.component.css']
})
export class FlowEditorComponent implements AfterViewInit {
    @ViewChild('container', { static: true }) container!: ElementRef;

    @Input() control: any;
    @Output() saveGraph = new EventEmitter<Models.WorkflowDefinition>();

    // --- CATÁLOGO DE NÓS (Hardcoded) ---
    public availableTools: Models.AgentTool[] = [
        // Gatilhos (Início)
        { id: 'start_channel', category: 'trigger', label: 'Iniciar por um canal', description: 'Inicia quando o contato entra.', icon: '💬' },

        // Condições
        { id: 'cond_custom', category: 'condition', label: 'Definir condição', description: 'Regras personalizadas.', icon: '🔀' },

    ];

    // Controle do Menu Flutuante
    public showToolMenu: boolean = true;
    public toggleToolMenu() { this.showToolMenu = !this.showToolMenu; }
    // No topo da classe
    searchTerm: string = '';

    // Ajuste o método de filtro para considerar a busca
    getToolsByCategory(category: string) {
        return this.availableTools.filter(tool => {
            const matchesCategory = tool.category === category;
            const matchesSearch = tool.label.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                tool.description?.toLowerCase().includes(this.searchTerm.toLowerCase());

            return matchesCategory && matchesSearch;
        });
    }

    private graph!: Graph;
    selectedCell: Cell | null = null;
    modalState: Models.ModalState = { visible: false, type: 'alert', title: '', message: '', confirmLabel: 'OK', pendingAction: null };

    constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef, private injector: Injector) {
        // Registra todos os nós definidos no config
        REGISTERED_NODES.forEach(node => {
            register({
                shape: node.shape,
                width: node.width,
                height: node.height,
                content: node.content,
                injector: this.injector
            });
        });
    }

    ngAfterViewInit() { this.initGraph(); }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['control'] && this.control) {
            this.control.getExportData = this.getExportData.bind(this);
            this.control.importData = this.importData.bind(this);
            this.control.clearCanvas = this.clearCanvas.bind(this);
            this.control.updateNodeData = this.apiUpdateNodeData.bind(this);
        }
    }

    private initGraph() {
        const options = getGraphOptions(this.container.nativeElement);
        options.connecting.validateConnection = (args: any) => validateConnectionRule({ ...args, graph: this.graph });

        (options as any).interacting = {
            nodeMovable: true,
            stopDelegateOnMousedown: false
        };

        this.graph = new Graph(options);

        // Agora salvamos na propriedade estática!
        FlowService.graph = this.graph;

        this.registerEvents();
    }

    private registerEvents() {
        this.graph.on('node:click', ({ node }) => this.ngZone.run(() => this.selectCell(node)));
        this.graph.on('edge:click', ({ edge }) => this.ngZone.run(() => this.selectCell(edge)));
        this.graph.on('blank:click', () => this.ngZone.run(() => this.resetSelection()));

        // Removemos o dblclick antigo, agora cuidaremos disso de outra forma
        // this.graph.on('node:dblclick', ...);

        // Botão flutuante genérico para apagar a LINHA
        this.graph.on('edge:mouseenter', ({ edge }) => edge.addTools([{ name: 'button-remove', args: { distance: '50%', offset: 0, onClick: () => edge.remove() } }]));
        this.graph.on('edge:mouseleave', ({ edge }) => edge.removeTools());
        this.graph.on('node:custom:delete', ({ node }: { node: Node }) => {
            this.ngZone.run(() => {
                this.graph.removeNode(node);
            });
        });

        // OUVIR O EVENTO DE COPIAR
        this.graph.on('node:custom:copy', ({ node }: { node: Node }) => {
            this.ngZone.run(() => {
                const pos = node.getPosition();
                const clone = node.clone();
                clone.position(pos.x + 40, pos.y + 40);
                this.graph.addNode(clone);
            });
        });
    }

    // --- FUNÇÕES DE AÇÃO DO GRAPH (Invocadas pelo Wrapper) ---
    public deleteNode(node: Node) { // Trocamos Cell por Node
        this.graph.removeCell(node);
    }

    public copyNode(node: Node) { // Trocamos Cell por Node
        this.ngZone.run(() => {
            const nodeData = node.getData();
            const originalPos = node.getPosition(); // Agora o TypeScript reconhece a posição perfeitamente!

            // Adiciona o novo nó com um pequeno offset para não sobrepor perfeitamente o antigo
            this.addNode(nodeData.type, nodeData.label, { x: originalPos.x + 30, y: originalPos.y + 30 });
        });
    }

    addNode(toolId: string, toolLabel?: string, position?: { x: number, y: number }) {
        const tool = this.availableTools.find(t => t.id === toolId);
        if (!tool) return;

        const nodeId = `node-${Date.now()}`;
        const x = (position?.x || 150) - 125;
        const y = (position?.y || 150) - 50;

        // Pegamos a configuração pronta do nosso arquivo externo
        const nodeOptions = getNodeConfig(toolId, nodeId, toolLabel || tool.label);

        // Adicionamos ao gráfico com a posição tratada aqui
        this.graph.addNode({
            ...nodeOptions,
            x,
            y
        });
    }

    onDragStart(event: DragEvent, type: string, label: string = '') {
        event.dataTransfer?.setData('application/json', JSON.stringify({ type, label }));
    }
    onDragOver(event: DragEvent) { event.preventDefault(); }
    onDrop(event: DragEvent) {
        event.preventDefault();
        const dataString = event.dataTransfer?.getData('application/json');
        if (!dataString) return;
        try {
            const { type, label } = JSON.parse(dataString);
            const { x, y } = this.graph.clientToLocal(event.clientX, event.clientY);
            this.addNode(type, label, { x, y });
        } catch (e) { console.error(e); }
    }

    public apiUpdateNodeData(nodeId: string, newConfig: any, newLabel?: string) {
        const cell = this.graph.getCellById(nodeId);
        if (cell && cell.isNode()) {
            const currentData = cell.getData();
            let displayLabel = newLabel || currentData.label;
            cell.setData({ ...currentData, config: newConfig, label: displayLabel });
            if (displayLabel) cell.attr('label/text', displayLabel);
        }
    }

    public getExportData() { return { logic: this.graph.toJSON(), graph: this.graph.toJSON() }; }
    public importData(data: any) { try { const graphData = typeof data === 'string' ? JSON.parse(data) : data; if (!graphData) return false; this.graph.fromJSON(graphData); return true; } catch { return false; } }
    public clearCanvas() { this.graph.clearCells(); }
    public confirmClearCanvas() { this.showSystemConfirm('Limpar Fluxo', 'Apagar todo o fluxo?', () => this.clearCanvas()); }
    triggerFileInput() { document.getElementById('fileInput')?.click(); }
    onFileSelected(event: any) { const file = event.target.files[0]; if (!file) return; FlowUtils.readJsonFile(file).then(json => this.importData(json)); event.target.value = ''; }
    selectCell(cell: Cell) { this.resetSelection(); this.selectedCell = cell; cell.isNode() ? cell.attr('body', { stroke: '#ff9c6e', strokeWidth: 3 }) : cell.attr('line', { stroke: '#ff9c6e', strokeWidth: 3 }); }
    resetSelection() { if (this.selectedCell) { if (this.selectedCell.isNode()) { const type = this.selectedCell.getData()?.type; const tool = this.availableTools.find(t => t.id === type); const strokeColor = tool?.category === 'trigger' ? '#52c41a' : (tool?.category === 'condition' ? '#faad14' : '#1890ff'); this.selectedCell.attr('body', { stroke: strokeColor, strokeWidth: 2 }); } else if (this.selectedCell.isEdge()) { this.selectedCell.attr('line', { stroke: '#5F95FF', strokeWidth: 2 }); } } this.selectedCell = null; }
    @HostListener('window:keydown', ['$event']) handleKeyDown(event: KeyboardEvent) { if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedCell) { if (this.selectedCell.isEdge()) { this.graph.removeCell(this.selectedCell); this.selectedCell = null; } } }
    private showSystemAlert(title: string, message: string, type: string = 'info') { this.modalState = { visible: true, type, title, message, confirmLabel: 'Entendi', pendingAction: null }; this.cdr.detectChanges(); }
    private showSystemConfirm(title: string, message: string, onConfirm: () => void) { this.modalState = { visible: true, type: 'confirm', title, message, confirmLabel: 'Sim', pendingAction: onConfirm }; }
    confirmModalAction() { this.modalState.pendingAction?.(); this.closeModal(); }
    closeModal() { this.modalState.visible = false; this.modalState.pendingAction = null; this.cdr.detectChanges(); }
}