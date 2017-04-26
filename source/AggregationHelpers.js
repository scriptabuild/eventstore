
// Helper library for creating EventAggregators/queries (to create models) for the eventsource logs
// When building a model from events
// - aggregate occurrences
//   - keep all occurrences in an array
//   - keep all occurrences in an object. (Supply fn for key extraction, no default)
//   - run reducer on occurrences. (Supply fn for key extraction, identity fn is default)
// - keep first/last occurrence
// - remove occurrence
// - any custom javascript code
