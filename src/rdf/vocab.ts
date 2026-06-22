export const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
export const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';
export const OWL = 'http://www.w3.org/2002/07/owl#';
export const SKOS = 'http://www.w3.org/2004/02/skos/core#';
export const DCTERMS = 'http://purl.org/dc/terms/';
export const XSD = 'http://www.w3.org/2001/XMLSchema#';

export const RDF_TYPE = `${RDF}type`;
export const RDFS_LABEL = `${RDFS}label`;
export const SKOS_PREFLABEL = `${SKOS}prefLabel`;
export const DCTERMS_TITLE = `${DCTERMS}title`;

/** Well-known prefixes used to expand CURIE configuration values to IRIs. */
export const KNOWN_PREFIXES: Record<string, string> = {
  rdf: RDF,
  rdfs: RDFS,
  owl: OWL,
  skos: SKOS,
  dcterms: DCTERMS,
  xsd: XSD,
};

export const DEFAULT_PREFERRED_LABEL_CURIES = ['rdfs:label', 'skos:prefLabel', 'dcterms:title'];
