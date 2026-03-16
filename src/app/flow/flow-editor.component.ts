import { Component, AfterViewInit, ViewChild, ElementRef, NgZone, ChangeDetectorRef, Input, Output, EventEmitter, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Graph, Cell, Node } from '@antv/x6';
import { register } from '@antv/x6-angular-shape';

import * as Models from './flow.models';
import { getGraphOptions, validateConnectionRule } from './flow-graph.config';
import { FlowService } from './flow.service';
import { getNodeConfig, REGISTERED_NODES } from './flow-nodes.config';
import { AVAILABLE_TOOLS, CATEGORY_CONFIG } from './flow-catalog.config';
import { setupGraphEvents } from './flow-events.manager';

@Component({
    selector: 'app-flow-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './flow-editor.component.html',
    styleUrls: ['./flow-editor.component.css']
})
export class FlowEditorComponent implements AfterViewInit {
    // --- ELEMENTOS E COMUNICAÇÃO ---
    @ViewChild('container', { static: true }) container!: ElementRef;
    @Input() control: any;
    @Output() saveGraph = new EventEmitter<Models.WorkflowDefinition>();

    // --- ESTADOS GERAIS DA UI ---
    public availableTools = AVAILABLE_TOOLS;
    public searchTerm: string = '';
    public showToolMenu: boolean = true;
    public selectedCell: Cell | null = null;

    // --- ESTADOS DAS MODAIS DE MENSAGEM ---
    activeMessageNode: Node | null = null;
    showAttachmentModal = false;
    showVariablesModal = false;
    variablesModalPos = { x: 0, y: 0 };
    searchVar = '';
    selectedFile: File | null = null;
    isDraggingFile = false;

    // --- DADOS MOCKADOS ---
    variablesList = [
        { label: '{{Contexto.DataAtualUTC}}', value: '{{Contexto.DataAtualUTC}}' },
        { label: '{{Conversa.Id}}', value: '{{Conversa.Id}}' },
        { label: '{{Conversa.DataDeCriacaoUTC}}', value: '{{Conversa.DataDeCriacaoUTC}}' },
        { label: '{{Atendente.PrimeiroNome}}', value: '{{Atendente.PrimeiroNome}}' },
        { label: '{{Contato.Id}}', value: '{{Contato.Id}}' }
    ];

    private graph!: Graph;

    // ==========================================
    // CICLOS DE VIDA E INICIALIZAÇÃO
    // ==========================================
    constructor(
        private ngZone: NgZone,
        private cdr: ChangeDetectorRef,
        private injector: Injector
    ) {
        this.registerAngularNodes();
    }

    ngAfterViewInit() {
        this.initGraph();
    }

    private registerAngularNodes() {
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

    private initGraph() {
        const options = getGraphOptions(this.container.nativeElement);
        options.connecting.validateConnection = (args: any) => validateConnectionRule({ ...args, graph: this.graph });

        this.graph = new Graph(options);
        FlowService.graph = this.graph;

        setupGraphEvents(this.graph, this.ngZone, this);
        this.setupExternalControls();
    }

    // ==========================================
    // MENU E FERRAMENTAS LATERAIS
    // ==========================================
    getCategoryInfo(cat: string) {
        return CATEGORY_CONFIG[cat] || { label: cat.toUpperCase(), color: '#fff' };
    }

    toggleToolMenu() {
        this.showToolMenu = !this.showToolMenu;
    }

    getToolsByCategory(category: string) {
        return this.availableTools.filter(t =>
            t.category === category &&
            (t.label.toLowerCase().includes(this.searchTerm.toLowerCase()) || !this.searchTerm)
        );
    }

    // ==========================================
    // INTERAÇÕES NO GRAFO (SELEÇÃO E NÓS)
    // ==========================================
    selectCell(cell: Cell) {
        this.resetSelection();
        this.selectedCell = cell;

        if (cell.isNode()) {
            cell.attr('body', { stroke: '#ff9c6e', strokeWidth: 3 });
        } else if (cell.isEdge()) {
            cell.attr('line', { stroke: '#ff9c6e', strokeWidth: 3 });
        }
    }

    resetSelection() {
        if (this.selectedCell) {
            if (this.selectedCell.isNode()) {
                const data = this.selectedCell.getData();
                const tool = this.availableTools.find(t => t.id === data.type);
                const color = tool ? this.getCategoryInfo(tool.category).color : '#5F95FF';
                this.selectedCell.attr('body', { stroke: color, strokeWidth: 2 });
            } else if (this.selectedCell.isEdge()) {
                this.selectedCell.attr('line', { stroke: '#5F95FF', strokeWidth: 2 });
            }
        }
        this.selectedCell = null;
    }

    addNode(toolId: string, toolLabel?: string, position?: { x: number, y: number }) {
        const tool = this.availableTools.find(t => t.id === toolId);
        if (!tool) return;

        const nodeId = `node-${Date.now()}`;
        const nodeOptions = getNodeConfig(toolId, nodeId, toolLabel || tool.label);

        this.graph.addNode({
            ...nodeOptions,
            x: (position?.x || 150) - 125,
            y: (position?.y || 150) - 50
        });
    }

    copyNode(node: Node) {
        const data = node.getData();
        const pos = node.getPosition();
        this.addNode(data.type, data.label, { x: pos.x + 30, y: pos.y + 30 });
    }

    deleteNode(node: Node) {
        this.graph.removeNode(node);
        if (this.selectedCell === node) this.selectedCell = null;
    }

    // ==========================================
    // ARRASTAR E SOLTAR (DRAG & DROP CANVAS)
    // ==========================================
    onDragStart(e: DragEvent, type: string, label: string) {
        e.dataTransfer?.setData('application/json', JSON.stringify({ type, label }));
    }

    onDragOver(e: DragEvent) {
        e.preventDefault();
    }

    onDrop(e: DragEvent) {
        e.preventDefault();
        const dataString = e.dataTransfer?.getData('application/json');
        if (!dataString) return;

        try {
            const { type, label } = JSON.parse(dataString);
            const { x, y } = this.graph.clientToLocal(e.clientX, e.clientY);
            this.addNode(type, label, { x, y });
        } catch (e) {
            console.error("Erro ao processar drop:", e);
        }
    }

    // ==========================================
    // CONTROLE DE MODAIS (MENSAGEM/ANEXOS/VARIÁVEIS)
    // ==========================================
    get filteredVariables() {
        if (!this.searchVar) return this.variablesList;
        return this.variablesList.filter(v => v.label.toLowerCase().includes(this.searchVar.toLowerCase()));
    }

    openVariablesModal(node: Node, x: number, y: number) {
        this.activeMessageNode = node;
        this.variablesModalPos = { x, y };
        this.showVariablesModal = true;
    }

    insertVariable(val: string) {
        if (this.activeMessageNode) {
            const data = this.activeMessageNode.getData();
            let text = data?.config?.messageText || '';
            text += (text.length > 0 && !text.endsWith(' ') ? ' ' : '') + val + ' ';
            this.activeMessageNode.setData({ ...data, config: { ...data.config, messageText: text } });
        }
        this.closeMessageModals();
    }

    openAttachmentModal(node: Node) {
        this.activeMessageNode = node;
        this.showAttachmentModal = true;
    }

    triggerFileInput() {
        document.getElementById('hidden-file-input')?.click();
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) this.handleFile(file);
    }

    onDragOverFile(event: DragEvent) {
        event.preventDefault();
        this.isDraggingFile = true;
    }

    onDragLeaveFile(event: DragEvent) {
        event.preventDefault();
        this.isDraggingFile = false;
    }

    onFileDropArea(event: DragEvent) {
        event.preventDefault();
        this.isDraggingFile = false;
        const file = event.dataTransfer?.files[0];
        if (file) this.handleFile(file);
    }

    handleFile(file: File) {
        if (file.size > 20 * 1024 * 1024) {
            alert('O arquivo excede o limite de 20MB.');
            return;
        }
        this.selectedFile = file;
    }

    removeSelectedFile() {
        this.selectedFile = null;
        const input = document.getElementById('hidden-file-input') as HTMLInputElement;
        if (input) input.value = '';
    }

    confirmAttachment() {
        if (this.activeMessageNode && this.selectedFile) {
            const data = this.activeMessageNode.getData();
            const attachmentData = {
                name: this.selectedFile.name,
                size: this.selectedFile.size,
                type: this.selectedFile.type
            };
            this.activeMessageNode.setData({
                ...data,
                config: { ...data.config, attachment: attachmentData }
            });
        }
        this.closeMessageModals();
    }

    closeMessageModals() {
        this.showAttachmentModal = false;
        this.showVariablesModal = false;
        this.activeMessageNode = null;
        this.searchVar = '';
        this.selectedFile = null;
        this.isDraggingFile = false;
    }

    // ==========================================
    // INTEGRAÇÃO DE API EXTERNA
    // ==========================================
    private setupExternalControls() {
        if (this.control) {
            this.control.getExportData = () => ({ logic: this.graph.toJSON() });
            this.control.importData = (data: any) => {
                if (!data) return;
                this.graph.fromJSON(data);
            };
            this.control.clearCanvas = () => this.graph.clearCells();
        }
    }
}