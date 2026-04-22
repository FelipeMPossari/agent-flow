import { Component, AfterViewInit, ViewChild, ElementRef, NgZone, ChangeDetectorRef, Input, Output, EventEmitter, Injector, HostListener, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Graph, Cell, Node } from '@antv/x6';
import { register } from '@antv/x6-angular-shape';

import * as Models from './flow.models';
import { getGraphOptions, validateConnectionRule, getPortGroups } from './flow-graph.config';
import { FlowService } from './flow.service';
import { getNodeConfig, REGISTERED_NODES } from './flow-nodes.config';
import { AVAILABLE_TOOLS, CATEGORY_CONFIG } from './flow-catalog.config';
import { setupGraphEvents } from './flow-events.manager';
import { ThemeService } from './theme.service';

@Component({
    selector: 'app-flow-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './flow-editor.component.html',
    styleUrls: ['./flow-editor.component.css']
})
export class FlowEditorComponent implements AfterViewInit, OnChanges {
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

    // --- ESTADOS DA MODAL DE CONDIÇÃO ---
    activeConditionNode: Node | null = null;
    showConditionModal = false;
    conditionGroups: Array<{ id: string; name?: string; conditions: any[] }> = [];
    activeTabCondition = 'Configurações';
    openDropdowns: { [key: string]: boolean } = {};

    // --- ESTADOS DA MODAL DE NOTIFICAÇÃO ---
    showNotificationModal = false;
    isClosingNotification = false;
    notificationType: 'error' | 'warning' | 'success' | 'info' = 'info';
    notificationTitle = '';
    notificationMessage = '';
    private notificationTimer: any = null;

    // --- DADOS MOCKADOS ---
    variablesList = [
        { label: '{{Contexto.DataAtualUTC}}', value: '{{Contexto.DataAtualUTC}}' },
        { label: '{{Conversa.Id}}', value: '{{Conversa.Id}}' },
        { label: '{{Conversa.DataDeCriacaoUTC}}', value: '{{Conversa.DataDeCriacaoUTC}}' },
        { label: '{{Atendente.PrimeiroNome}}', value: '{{Atendente.PrimeiroNome}}' },
        { label: '{{Contato.Id}}', value: '{{Contato.Id}}' }
    ];

    // Propriedades disponíveis para condições
    availableProperties = [
        {
            label: 'Campo do contato',
            value: 'contact_field',
            type: 'select',
            options: [
                { label: 'Opção 1', value: 'opt1' },
                { label: 'Opção 2', value: 'opt2' }
            ]
        },
        { label: 'Nome', value: 'name', type: 'text' },
        { label: 'Email', value: 'email', type: 'text' },
        { label: 'Telefone', value: 'phone', type: 'text' },
        {
            label: 'Status', value: 'status', type: 'select',
            options: [
                { label: 'Ativo', value: 'active' },
                { label: 'Inativo', value: 'inactive' }
            ]
        },
        { label: 'Data de criação', value: 'created_date', type: 'date' },
        { label: 'Última interação', value: 'last_interaction', type: 'date' }
    ];

    // Operadores mapeados por tipo de propriedade
    operatorsByType: { [key: string]: { label: string; value: string }[] } = {
        text: [
            { label: 'Igual a', value: 'eq' },
            { label: 'Diferente de', value: 'neq' },
            { label: 'Começa com', value: 'starts_with' },
            { label: 'Termina com', value: 'ends_with' },
            { label: 'Contém', value: 'contains' },
            { label: 'Está vazio', value: 'is_empty' },
            { label: 'Não está vazio', value: 'is_not_empty' }
        ],
        select: [
            { label: 'Igual a', value: 'eq' },
            { label: 'Diferente de', value: 'neq' },
            { label: 'Está vazio', value: 'is_empty' },
            { label: 'Não está vazio', value: 'is_not_empty' }
        ],
        date: [
            { label: 'Igual a', value: 'eq' },
            { label: 'Diferente de', value: 'neq' },
            { label: 'Maior que', value: 'gt' },
            { label: 'Menor que', value: 'lt' },
            { label: 'Está vazio', value: 'is_empty' },
            { label: 'Não está vazio', value: 'is_not_empty' }
        ]
    };

    private graph!: Graph;

    // ==========================================
    // CICLOS DE VIDA E INICIALIZAÇÃO
    // ==========================================
    constructor(
        private ngZone: NgZone,
        private cdr: ChangeDetectorRef,
        private injector: Injector,
        public themeService: ThemeService
    ) {
        this.registerAngularNodes();
    }

    ngAfterViewInit() {
        this.initGraph();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['control'] && this.control && this.graph) {
            this.setupExternalControls();
        }
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
        const theme = this.themeService.getTheme();
        const options = getGraphOptions(this.container.nativeElement, theme);
        options.connecting.validateConnection = (args: any) => validateConnectionRule({ ...args, graph: this.graph });

        this.graph = new Graph(options);
        FlowService.graph = this.graph;

        setupGraphEvents(this.graph, this.ngZone, this);

        // Atualiza o gráfico quando o tema muda
        this.themeService.theme$.subscribe((newTheme) => {
            if (this.graph) {
                // Salva o estado atual do gráfico
                const nodes = this.graph.getNodes();
                const edges = this.graph.getEdges();
                const translate = this.graph.translate();

                // Destroi o gráfico antigo
                this.graph.dispose();

                // Recria o gráfico com o novo tema
                const newOptions = getGraphOptions(this.container.nativeElement, newTheme);
                newOptions.connecting.validateConnection = (args: any) => validateConnectionRule({ ...args, graph: this.graph });

                this.graph = new Graph(newOptions);
                FlowService.graph = this.graph;

                // Restaura os nós e arestas
                this.graph.addNodes(nodes);
                this.graph.addEdges(edges);

                // Atualiza os estilos de porta para o novo tema nos nós recém-adicionados
                const newPortGroups = getPortGroups(newTheme);
                this.graph.getNodes().forEach(node => {
                    node.getPorts().forEach(port => {
                        const group = port.group as 'in' | 'out';
                        if (group && newPortGroups[group]) {
                            node.setPortProp(port.id!, ['attrs', 'circle'], newPortGroups[group].attrs.circle);
                        }
                    });
                });

                // Restaura a posição
                this.graph.translate(translate.tx, translate.ty);

                // Reconfigura os eventos
                setupGraphEvents(this.graph, this.ngZone, this);
            }
        });
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
            this.showNotification('error', 'Arquivo muito grande', 'O arquivo excede o limite de 20MB.');
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
    // CONTROLE DE MODAL DE CONDIÇÃO
    // ==========================================
    openConditionModal(node: Node) {
        this.activeConditionNode = node;
        const data = node.getData();

        // Sempre faz uma cópia profunda para não compartilhar referências
        if (data?.config?.conditionGroups && data.config.conditionGroups.length > 0) {
            this.conditionGroups = JSON.parse(JSON.stringify(data.config.conditionGroups));
        } else {
            // Sempre inicia com 1 grupo padrão
            this.conditionGroups = [{
                id: `group-${Date.now()}`,
                name: '',
                conditions: [{
                    id: `condition-${Date.now()}`,
                    variable: '',
                    operatorType: '',
                    targetValue: '',
                    logicType: 'AND' as const
                }]
            }];
        }

        this.showConditionModal = true;
        this.activeTabCondition = 'Configurações';
        this.openDropdowns = {}; // Reseta dropdowns
        this.resetConditionForm();
    }

    closeConditionModal() {
        this.showConditionModal = false;
        this.activeConditionNode = null;
        this.resetConditionForm();
    }

    resetConditionForm() {
        // Form reset if needed
    }

    addConditionGroup() {
        const newGroup = {
            id: `group-${Date.now()}`,
            name: '',
            conditions: [{
                id: `condition-${Date.now()}`,
                variable: '',
                operatorType: '',
                targetValue: ''
            }]
        };

        this.conditionGroups.push(newGroup);
        this.resetConditionForm();
    }

    getPropertyType(propertyValue: string): string {
        const property = this.availableProperties.find(p => p.value === propertyValue);
        return property ? (property as any).type : 'text';
    }

    getPropertyOptions(propertyValue: string): any[] {
        const property = this.availableProperties.find(p => p.value === propertyValue);
        return property ? (property as any).options || [] : [];
    }

    getOperatorsForProperty(propertyValue: string): any[] {
        const property = this.availableProperties.find(p => p.value === propertyValue);
        if (!property) return this.operatorsByType['text'];

        const type = (property as any).type;
        const customOperators = (property as any).operators;

        if (customOperators) {
            return this.operatorsByType[type].filter(op => customOperators.includes(op.value));
        }

        return this.operatorsByType[type] || this.operatorsByType['text'];
    }

    addConditionToGroup(groupId: string) {
        const group = this.conditionGroups.find(g => g.id === groupId);
        if (group) {
            group.conditions.push({
                id: `condition-${Date.now()}`,
                variable: '',
                operatorType: '',
                targetValue: '',
                logicType: 'AND' as const
            });
        }
    }

    removeCondition(groupId: string, conditionId: string) {
        const group = this.conditionGroups.find(g => g.id === groupId);
        if (group) {
            group.conditions = group.conditions.filter(c => c.id !== conditionId);
        }
    }

    removeConditionGroup(groupId: string) {
        this.conditionGroups = this.conditionGroups.filter(g => g.id !== groupId);
    }

    confirmConditions() {
        if (this.conditionGroups.length === 0) {
            this.showNotification('error', 'Condições obrigatórias', 'É necessário adicionar pelo menos um grupo de condições');
            return;
        }

        if (this.activeConditionNode) {
            const data = this.activeConditionNode.getData();
            const isConfigured = this.conditionGroups.some(g => g.conditions.length > 0);

            const newData = {
                ...data,
                config: {
                    ...data.config,
                    conditionGroups: JSON.parse(JSON.stringify(this.conditionGroups)),
                    isConfigured: isConfigured
                }
            };

            this.activeConditionNode.setData(newData);

            // Força o disparo do evento de mudança para o componente detectar
            this.activeConditionNode.trigger('change:data', { current: newData });
        }

        this.closeConditionModal();
    }

    changeConditionTab(tabName: string) {
        this.activeTabCondition = tabName;
    }

    toggleDropdown(conditionId: string, field: 'property' | 'operator' | 'value') {
        const key = `${conditionId}-${field}`;
        this.openDropdowns[key] = !this.openDropdowns[key];
    }

    closeAllDropdowns() {
        this.openDropdowns = {};
    }

    getSelectedPropertyLabel(propertyValue: string): string {
        const prop = this.availableProperties.find(p => p.value === propertyValue);
        return prop?.label || 'Propriedade';
    }

    getSelectedOperatorLabel(operatorValue: string, propertyValue: string): string {
        const operators = this.getOperatorsForProperty(propertyValue);
        const op = operators.find(o => o.value === operatorValue);
        return op?.label || 'Operador';
    }

    getSelectedValueLabel(valueValue: string, propertyValue: string): string {
        const options = this.getPropertyOptions(propertyValue);
        const opt = options.find(o => o.value === valueValue);
        return opt?.label || valueValue || 'Selecione';
    }

    // ==========================================
    // CONTROLE DE MODAL DE NOTIFICAÇÃO
    // ==========================================
    showNotification(type: 'error' | 'warning' | 'success' | 'info', title: string, message: string, autoClose: boolean = true) {
        this.notificationType = type;
        this.notificationTitle = title;
        this.notificationMessage = message;
        this.showNotificationModal = true;

        if (autoClose) {
            // Limpa o timer anterior se houver
            if (this.notificationTimer) {
                clearTimeout(this.notificationTimer);
            }

            // Define novo timer para fechar automaticamente em 4 segundos
            this.notificationTimer = setTimeout(() => {
                this.ngZone.run(() => {
                    this.closeNotification();
                });
            }, 4000);
        }
    }

    closeNotification() {
        // Inicia a animação de fade-out
        this.isClosingNotification = true;
        this.cdr.detectChanges();

        // Aguarda a animação terminar (300ms) antes de realmente fechar
        setTimeout(() => {
            this.showNotificationModal = false;
            this.isClosingNotification = false;
            this.cdr.detectChanges();
        }, 500);

        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
            this.notificationTimer = null;
        }
    }

    // ==========================================
    // ==========================================
    // INTEGRAÇÃO DE API EXTERNA
    // ==========================================
    private setupExternalControls() {
        if (this.control) {
            this.control.getExportData = this.getExportData.bind(this);
            this.control.importData = this.importData.bind(this);
            this.control.clearCanvas = this.clearCanvas.bind(this);
        }
    }

    public getExportData() {
        const fullGraph = this.graph.toJSON();

        const logicData = {
            nodes: fullGraph.cells
                .filter((c: any) => c.shape !== 'edge')
                .map((n: any) => ({
                    id: n.id,
                    type: n.data?.type,
                    label: n.data?.label,
                    config: n.data?.config || {}
                })),
            edges: fullGraph.cells
                .filter((c: any) => c.shape === 'edge')
                .map((e: any) => ({
                    id: e.id,
                    source: e.source.cell,
                    target: e.target.cell,
                    sourcePort: e.source.port,
                    targetPort: e.target.port
                }))
        };

        return { logic: logicData, graph: fullGraph };
    }

    public importData(data: any) {
        if (!data) return;

        // Se for string JSON, faz parsing
        let graphData = typeof data === 'string' ? JSON.parse(data) : data;

        // Limpa o gráfico antes de importar
        this.graph.clearCells();

        // Importa os dados
        this.graph.fromJSON(graphData);
    }

    public clearCanvas() {
        this.graph.clearCells();
    }
}