import { Injectable } from '@angular/core';
import { Graph } from '@antv/x6';

@Injectable({
    providedIn: 'root'
})
export class FlowService {
    // A MÁGICA: O 'static' ignora a injeção do Angular. Ele é absoluto na memória.
    public static graph: Graph;
}