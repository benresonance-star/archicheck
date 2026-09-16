export function templateChecksumPayload(
  template: Record<string, unknown>,
): Record<string, unknown> {
  const { checksum: _checksum, ...rest } = template;
  void _checksum;
  return rest;
}
