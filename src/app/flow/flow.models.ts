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