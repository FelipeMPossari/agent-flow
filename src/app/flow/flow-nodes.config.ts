import { NodeConditionComponent } from '../nodes/node-condition.component';
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
        width: 250,
        height: 250,
        content: NodeConditionComponent,
    }
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
                width: 280,
                height: 320,
                ports: {
                    groups: {
                        ...PORT_GROUPS,
                        // O grupo absoluto agora clona o visual exato da porta de entrada
                        'out-absolute': {
                            position: 'absolute',
                            attrs: PORT_GROUPS.in.attrs
                        }
                    },
                    items: [
                        { group: 'in', id: 'in' },
                        {
                            group: 'out-absolute',
                            id: 'out-true',
                            args: { x: 280, y: 65 }
                        },
                        {
                            group: 'out-absolute',
                            id: 'out-false',
                            args: { x: 280, y: 125 }
                        }
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