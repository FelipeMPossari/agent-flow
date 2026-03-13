import { Shape } from '@antv/x6';

export const LABEL_STYLE = {
    fill: '#e0e0e0', // Texto claro para o Dark Mode
    fontSize: 14,
    fontFamily: 'Segoe UI',
    fontWeight: 600,
    textAnchor: 'middle',
    refX: 0.5,
    refY: 0.5,
    textWrap: {
        width: 200,
        height: 80,
        ellipsis: true,
        breakWord: false
    }
};

// Portas genéricas (podemos ter múltiplas saídas dinâmicas depois)
export const PORT_GROUPS = {
    in: {
        position: 'left',
        attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', fill: '#2b2f33', strokeWidth: 2 } }
    },
    out: {
        position: 'right',
        attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', fill: '#2b2f33', strokeWidth: 2 } }
    }
};

export const validateConnectionRule = ({ sourceMagnet, targetMagnet, sourceView, targetView }: any) => {
    if (!sourceMagnet || !targetMagnet || !sourceView || !targetView) return false;

    const sourceGroup = sourceMagnet.getAttribute('port-group');
    const targetGroup = targetMagnet.getAttribute('port-group');

    // 1. Sentido Obrigatório: Uma porta 'out' só liga numa porta 'in'
    if (sourceGroup === targetGroup) return false;
    if (sourceGroup === 'in') return false;

    // 2. Nó de Início (Gatilho) não pode receber conexões de volta
    const targetType = targetView.cell.getData()?.type;
    if (targetType === 'start_channel' || targetType === 'start_manual') return false;

    // Removemos todas as outras regras! Loops são permitidos em Chatbots.
    return true;
};

export const getGraphOptions = (container: HTMLElement) => ({
    container: container,
    grid: { size: 20, visible: true, type: 'mesh', args: { color: '#333' } }, // Malha escura
    background: { color: '#1e1e1e' }, // Fundo Dark Mode
    panning: true,
    mousewheel: { enabled: true, modifiers: ['ctrl', 'meta'] as ('ctrl' | 'meta')[] },
    interacting: true,
    connecting: {
        router: 'manhattan',
        connector: { name: 'rounded', args: { radius: 8 } },
        anchor: 'center',
        connectionPoint: 'boundary',
        snap: true,
        allowBlank: false,
        highlight: true,
        createEdge() {
            return new Shape.Edge({
                attrs: { line: { stroke: '#5F95FF', strokeWidth: 2, targetMarker: { name: 'block', width: 12, height: 8 } } },
                zIndex: 0
            });
        },
        validateConnection: validateConnectionRule
    },
});