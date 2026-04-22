import { NodeConditionComponent } from '../nodes/node-condition.component';
import { NodeMessageComponent } from '../nodes/node-message.component';
import { NodeStartChannelComponent } from '../nodes/node-start-channel.component';
import { PORT_GROUPS } from './flow-graph.config';

export const REGISTERED_NODES = [
    {
        shape: 'ng-start-channel',
        width: 250,
        height: 180,
        content: NodeStartChannelComponent,
    },
    {
        shape: 'ng-condition',
        width: 320,
        height: 420,
        content: NodeConditionComponent,
    },
    {
        shape: 'ng-message',
        width: 280,
        height: 320,
        content: NodeMessageComponent,
    },
];

export const getNodeConfig = (toolId: string, nodeId: string, toolLabel: string) => {
    const baseConfig = {
        id: nodeId,
        data: { id: nodeId, type: toolId, label: toolLabel, config: {} },
        ports: { groups: PORT_GROUPS }
    };

    switch (toolId) {
        case 'start_channel':
            return {
                ...baseConfig,
                shape: 'ng-start-channel',
                width: 250,
                height: 180,
                ports: { ...baseConfig.ports, items: [{ group: 'out', id: 'out' }] }
            };

        case 'cond_custom':
            return {
                ...baseConfig,
                shape: 'ng-condition',
                width: 320,
                height: 420,
                ports: {
                    groups: {
                        ...PORT_GROUPS,
                        // Grupo para portas dinâmicas de saída (posicionamento absoluto)
                        'out-absolute': {
                            position: 'absolute',
                            attrs: PORT_GROUPS.out.attrs
                        }
                    },
                    items: [
                        { group: 'in', id: 'in' }
                        // Portas dinâmicas serão criadas pelo componente baseado nos grupos de condições
                    ]
                }
            };

        case 'send_message':
            return {
                ...baseConfig,
                shape: 'ng-message',
                width: 280,
                height: 320,
                ports: {
                    ...baseConfig.ports,
                    items: [
                        { group: 'in', id: 'in' },
                        { group: 'out', id: 'out' }
                    ]
                }
            };

        default:
            // Configuração para nós padrão/fallback
            return {
                ...baseConfig,
                width: 200,
                height: 100,
                ports: { ...baseConfig.ports, items: [{ group: 'in', id: 'in' }, { group: 'out', id: 'out' }] }
            };
    }
};
