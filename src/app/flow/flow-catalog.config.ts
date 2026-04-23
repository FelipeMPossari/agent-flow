import * as Models from './flow.models';

export const CATEGORY_CONFIG: Record<string, { label: string, color: string }> = {
    trigger: { label: 'INÍCIO', color: '#52c41a' },
    condition: { label: 'CONDIÇÃO', color: '#faad14' },
    action: { label: 'AÇÃO', color: '#1890ff' }
};

export const AVAILABLE_TOOLS: Models.AgentTool[] = [
    {
        id: 'start_channel',
        category: 'trigger',
        label: 'Iniciar por um canal',
        description: 'Inicia quando o contato entra.',
        icon: '💬'
    },
    {
        id: 'cond_custom',
        category: 'condition',
        label: 'Definir condição',
        description: 'Regras personalizadas.',
        icon: '🔀'
    },
    {
        id: 'send_message',
        category: 'action',
        label: 'Enviar mensagem',
        description: 'Envia uma mensagem de texto.',
        icon: '💬'
    },
    {
        id: 'transfer_department',
        category: 'action',
        label: 'Transferir de setor',
        description: 'Transfere o atendimento para outro setor.',
        icon: '🔁'
    },
    {
        id: 'web_request',
        category: 'action',
        label: 'Requisição Web',
        description: 'Faz uma requisição HTTP para um endpoint.',
        icon: '🌐'
    },
];