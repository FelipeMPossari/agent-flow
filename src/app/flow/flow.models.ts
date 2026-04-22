// --- CATÁLOGO DE FERRAMENTAS (Frontend) ---
export type ToolCategory = 'trigger' | 'condition' | 'action';

export interface AgentTool {
    id: string;
    category: ToolCategory;
    label: string;
    description?: string;
    icon?: string;
}

// --- EXPORTAÇÃO E FLUXO ---
export interface WorkflowNode {
    id: string;
    type: string;       // ex: 'start_channel', 'transfer_agent'
    label?: string;
    config?: any;       // Aqui vão morar os dados do form (horários, fuso, atendente, etc)
}

export interface WorkflowDefinition {
    firstStepId: string | null;
    nodes: WorkflowNode[];
    edges: any[];
}

// --- INTERFACE DO MODAL DO SISTEMA ---
export interface ModalState {
    visible: boolean;
    type: string;
    title: string;
    message: string;
    confirmLabel: string;
    pendingAction: (() => void) | null;
}

// --- CONTRATO: NÓ ENVIAR MENSAGEM (send_message) ---
export interface SendMessageConfig {
    messageText: string;
    attachment?: { name: string; size: number; type: string; };
    waitForResponse: boolean;
    variableName?: string;
}

// --- CONTRATO: NÓ CONDIÇÃO (cond_custom) COM PORTAS DINÂMICAS ---
export interface ConditionDetail {
    variable: string;
    operatorType: string;
    targetValue: string;
    logicType?: 'AND' | 'OR';
}

export interface ConditionGroup {
    id: string;
    name?: string;
    conditions: ConditionDetail[];
}

export interface CondCustomConfig {
    isConfigured: boolean;
    conditionGroups: ConditionGroup[];
}