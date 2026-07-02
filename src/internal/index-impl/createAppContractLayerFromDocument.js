import { createUniversalAstLayer } from '@shapeshift-labs/frontier-lang-kernel';

const APP_CONTRACT_NODE_KINDS = new Set([
  'entity',
  'state',
  'action',
  'view',
  'effect',
  'capability',
  'type',
  'extern',
  'lattice',
  'target',
  'migration'
]);

export function createAppContractLayerFromDocument(document, options = {}) {
  if (options.appContracts === false) return undefined;
  const nodes = Object.values(document?.nodes ?? {}).filter((node) => APP_CONTRACT_NODE_KINDS.has(node?.kind));
  if (!nodes.length) return undefined;
  const records = nodes.map(contractRecord);
  return createUniversalAstLayer({
    id: `layer:${document.id}:appContracts`,
    layer: 'appContracts',
    semanticNodeIds: records.map((record) => record.nodeId),
    effectIds: unique(records.flatMap((record) => record.effectIds ?? [])),
    references: records.map((record) => ({
      kind: 'semanticNode',
      id: record.nodeId,
      metadata: { contractKind: record.contractKind, nodeKind: record.nodeKind }
    })),
    records,
    metadata: {
      documentId: document.id,
      authoredFrontierContracts: true,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false,
      note: 'Authored Frontier program nodes are exposed as merge and projection contracts, not as a proof that target outputs are equivalent.'
    },
    summary: summarizeRecords(records)
  });
}

export function attachAppContractLayer(layers, document, options = {}) {
  const appContracts = createAppContractLayerFromDocument(document, options);
  if (!appContracts) return layers;
  if (Array.isArray(layers)) return [appContracts, ...layers];
  return { appContracts, ...(layers ?? {}) };
}

function contractRecord(node) {
  const record = {
    kind: 'frontier.lang.appContractRecord',
    version: 1,
    id: `app_contract_${node.id}`,
    nodeId: node.id,
    nodeKind: node.kind,
    contractKind: contractKind(node),
    name: node.name,
    effectIds: effectIds(node),
    metadata: {
      authoredFrontierNode: true,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    }
  };
  if (node.kind === 'entity') {
    record.fieldIds = (node.fields ?? []).map((field) => field.id).filter(Boolean);
    record.keyFieldIds = (node.fields ?? []).filter((field) => field.key).map((field) => field.id).filter(Boolean);
  }
  if (node.kind === 'state') {
    record.collectionIds = (node.collections ?? []).map((collection) => collection.id).filter(Boolean);
    record.collectionNames = (node.collections ?? []).map((collection) => collection.name).filter(Boolean);
  }
  if (node.kind === 'action') {
    record.reads = node.reads ?? [];
    record.writes = node.writes ?? [];
    record.uses = node.uses ?? [];
  }
  if (node.kind === 'view') {
    record.reads = node.reads ?? [];
    record.dispatches = node.dispatches ?? [];
    record.propIds = (node.props ?? []).map((prop) => prop.id).filter(Boolean);
    record.eventIds = (node.events ?? []).map((event) => event.id).filter(Boolean);
    record.renderIds = (node.renders ?? []).map((render) => render.id).filter(Boolean);
  }
  if (node.kind === 'effect') {
    record.capability = node.capability;
    record.resources = node.resources ?? [];
  }
  if (node.kind === 'capability') {
    record.capability = node.capability;
    record.category = node.category;
    record.adapterTargets = (node.adapters ?? []).map((adapter) => adapter.target).filter(Boolean);
    record.unsupportedTargets = (node.unsupportedTargets ?? []).map((entry) => entry.target).filter(Boolean);
  }
  if (node.kind === 'type') {
    record.fieldIds = (node.fields ?? []).map((field) => field.id).filter(Boolean);
    record.variantIds = (node.variants ?? []).map((variant) => variant.id).filter(Boolean);
    record.invariants = node.invariants ?? [];
  }
  if (node.kind === 'extern') {
    record.language = node.language;
    record.symbol = node.symbol;
    record.effects = node.effects ?? [];
    record.resources = node.resources ?? [];
  }
  if (node.kind === 'target') {
    record.target = node.target;
    record.projectionContractIds = (node.metadata?.projectionContracts ?? []).map((contract) => contract.id).filter(Boolean);
    record.projectionLayerIds = (node.metadata?.projectionLayers ?? []).map((layer) => layer.id).filter(Boolean);
  }
  if (node.kind === 'migration') {
    record.fromVersion = node.fromVersion;
    record.toVersion = node.toVersion;
    record.changeIds = (node.changes ?? []).map((change) => change.id).filter(Boolean);
    record.invariants = node.invariants ?? [];
  }
  return record;
}

function contractKind(node) {
  if (node.kind === 'entity' || node.kind === 'type') return 'data-shape';
  if (node.kind === 'state') return 'state-shape';
  if (node.kind === 'action') return 'mutation-boundary';
  if (node.kind === 'view') return 'view-contract';
  if (node.kind === 'effect' || node.kind === 'capability') return 'runtime-capability';
  if (node.kind === 'target') return 'projection-target';
  if (node.kind === 'extern') return 'foreign-boundary';
  if (node.kind === 'migration') return 'shape-migration';
  if (node.kind === 'lattice') return 'merge-algebra';
  return node.kind;
}

function effectIds(node) {
  if (node.kind === 'action') return node.uses ?? [];
  if (node.kind === 'effect' || node.kind === 'capability') return [node.id, node.name, node.capability].filter(Boolean);
  if (node.kind === 'extern') return node.effects ?? [];
  return [];
}

function summarizeRecords(records) {
  return {
    records: records.length,
    byNodeKind: countBy(records, 'nodeKind'),
    byContractKind: countBy(records, 'contractKind'),
    stateCollections: sum(records, 'collectionIds'),
    entityFields: sum(records.filter((record) => record.nodeKind === 'entity'), 'fieldIds'),
    typeFields: sum(records.filter((record) => record.nodeKind === 'type'), 'fieldIds'),
    actionReads: sum(records, 'reads'),
    actionWrites: sum(records, 'writes'),
    actionUses: sum(records, 'uses'),
    viewProps: sum(records, 'propIds'),
    viewEvents: sum(records, 'eventIds'),
    viewRenders: sum(records, 'renderIds'),
    effectResources: sum(records, 'resources'),
    capabilityAdapters: sum(records, 'adapterTargets'),
    unsupportedCapabilityTargets: sum(records, 'unsupportedTargets'),
    targetProjectionContracts: sum(records, 'projectionContractIds')
  };
}

function countBy(records, field) {
  const counts = {};
  for (const record of records) counts[record[field]] = (counts[record[field]] ?? 0) + 1;
  return counts;
}

function sum(records, field) {
  return records.reduce((total, record) => total + (record[field]?.length ?? 0), 0);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
