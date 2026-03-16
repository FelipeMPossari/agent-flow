import { Graph, Node, Edge, Cell } from '@antv/x6';
import { NgZone } from '@angular/core';

export function setupGraphEvents(graph: Graph, ngZone: NgZone, component: any) {

    // Tipando o evento de clique no nó
    graph.on('node:click', ({ node }: { node: Node }) => {
        ngZone.run(() => component.selectCell(node));
    });

    // Tipando o evento de clique na linha
    graph.on('edge:click', ({ edge }: { edge: Edge }) => {
        ngZone.run(() => component.selectCell(edge));
    });

    graph.on('blank:click', () => {
        ngZone.run(() => component.resetSelection());
    });

    // Toolbar de remover linha (mouseenter)
    graph.on('edge:mouseenter', ({ edge }: { edge: Edge }) => {
        edge.addTools([{
            name: 'button-remove',
            args: { distance: '50%', onClick: () => edge.remove() }
        }]);
    });

    graph.on('edge:mouseleave', ({ edge }: { edge: Edge }) => {
        edge.removeTools();
    });

    // Eventos Customizados vindos dos seus componentes Angular
    graph.on('node:custom:delete', ({ node }: { node: Node }) => {
        ngZone.run(() => graph.removeNode(node));
    });

    graph.on('node:custom:copy', ({ node }: { node: Node }) => {
        ngZone.run(() => component.copyNode(node));
    });

    graph.on('modal:attachment:open', ({ node }: { node: Node }) => {
        ngZone.run(() => component.openAttachmentModal(node));
    });

    graph.on('modal:variables:open', ({ node, x, y }: { node: Node, x: number, y: number }) => {
        ngZone.run(() => component.openVariablesModal(node, x, y));
    })
}