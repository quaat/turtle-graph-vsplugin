import * as React from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import type { GraphModel } from '../rdf/types';
import type { VisibleSet } from './filtering';
import type { Selection } from './state';

export interface GraphActions {
  fit: () => void;
  resetLayout: () => void;
}

export interface GraphCanvasProps {
  model: GraphModel;
  visible: VisibleSet;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  registerActions?: (actions: GraphActions) => void;
}

function toElements(model: GraphModel): ElementDefinition[] {
  const nodes: ElementDefinition[] = model.nodes.map((node) => ({
    data: { id: node.id, label: node.label, kind: node.kind },
  }));
  const edges: ElementDefinition[] = model.edges.map((edge) => ({
    data: { id: edge.id, source: edge.source, target: edge.target, label: edge.label },
  }));
  return [...nodes, ...edges];
}

const STYLE: cytoscape.StylesheetStyle[] = [
  {
    selector: 'node',
    style: {
      'background-color': '#4c8eda',
      label: 'data(label)',
      color: '#e0e0e0',
      'font-size': 10,
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'ellipsis',
      'text-max-width': '120px',
      width: 24,
      height: 24,
    },
  },
  {
    selector: 'node[kind = "blankNode"]',
    style: { 'background-color': '#9a7fd1', shape: 'round-rectangle' },
  },
  {
    selector: 'edge',
    style: {
      width: 1.5,
      'line-color': '#888',
      'target-arrow-color': '#888',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      label: 'data(label)',
      'font-size': 8,
      color: '#bbb',
      'text-rotation': 'autorotate',
    },
  },
  {
    selector: '.selected',
    style: { 'background-color': '#e2b340', 'line-color': '#e2b340', 'target-arrow-color': '#e2b340' },
  },
];

export function GraphCanvas(props: GraphCanvasProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const cyRef = React.useRef<Core | null>(null);
  const onSelectRef = React.useRef(props.onSelect);
  onSelectRef.current = props.onSelect;

  React.useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const cy = cytoscape({
      container: containerRef.current,
      elements: toElements(props.model),
      style: STYLE,
      layout: { name: 'cose', animate: false },
    });
    cyRef.current = cy;

    cy.on('tap', 'node', (evt) => onSelectRef.current({ kind: 'node', id: evt.target.id() }));
    cy.on('tap', 'edge', (evt) => onSelectRef.current({ kind: 'edge', id: evt.target.id() }));
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        onSelectRef.current(null);
      }
    });

    props.registerActions?.({
      fit: () => cy.fit(undefined, 30),
      resetLayout: () => cy.layout({ name: 'cose', animate: false }).run(),
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // Rebuild the graph when the underlying model changes.
  }, [props.model]);

  React.useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }
    cy.batch(() => {
      cy.nodes().forEach((el) =>
        el.style('display', props.visible.nodeIds.has(el.id()) ? 'element' : 'none'),
      );
      cy.edges().forEach((el) =>
        el.style('display', props.visible.edgeIds.has(el.id()) ? 'element' : 'none'),
      );
    });
  }, [props.visible]);

  React.useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }
    cy.elements().removeClass('selected');
    if (props.selection) {
      cy.getElementById(props.selection.id).addClass('selected');
    }
  }, [props.selection]);

  return <div className="graph-canvas" ref={containerRef} data-testid="graph-canvas" />;
}
