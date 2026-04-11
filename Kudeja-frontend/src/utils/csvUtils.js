/**
 * Shared CSV export utility for Kudeja admin panel
 */

/**
 * Convert an array of objects to a CSV string and trigger a file download.
 * @param {Object[]} data       - Array of row objects
 * @param {string}   filename   - Downloaded filename (without .csv)
 * @param {Array}    columns    - Array of { key, label } descriptors (optional – defaults to all keys)
 */
export function exportToCSV(data, filename, columns) {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  const cols = columns || Object.keys(data[0]).map((k) => ({ key: k, label: k }));

  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    // Wrap in quotes if contains comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = cols.map((c) => escape(c.label)).join(',');
  const rows = data.map((row) => cols.map((c) => escape(row[c.key])).join(','));
  const csv = [header, ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
