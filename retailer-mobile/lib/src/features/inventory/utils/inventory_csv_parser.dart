import '../../../models/models.dart';

class InventoryCsvParser {
  static const _requiredHeaders = ['sku', 'name', 'price'];

  static List<InventoryItemRequest> parse(String input) {
    final lines = input
        .split(RegExp(r'\r?\n'))
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList();

    if (lines.isEmpty) {
      throw const FormatException('CSV file is empty.');
    }

    final headers = _parseLine(lines.first).map((value) => value.toLowerCase()).toList();
    final headerIndex = <String, int>{};
    for (var i = 0; i < headers.length; i++) {
      headerIndex[headers[i]] = i;
    }

    final missing = _requiredHeaders.where((header) => !headerIndex.containsKey(header)).toList();
    if (missing.isNotEmpty) {
      throw FormatException('Missing required column(s): ${missing.join(', ')}');
    }

    final items = <InventoryItemRequest>[];
    for (var rowIndex = 1; rowIndex < lines.length; rowIndex++) {
      final rawLine = lines[rowIndex];
      if (rawLine.trim().isEmpty) continue;

      final cells = _parseLine(rawLine);
      final sku = _readCell(cells, headerIndex, 'sku');
      final name = _readCell(cells, headerIndex, 'name');
      final priceRaw = _readCell(cells, headerIndex, 'price');

      if (sku.isEmpty || name.isEmpty) {
        throw FormatException('Row ${rowIndex + 1}: SKU and Name are required.');
      }

      final priceValue = double.tryParse(priceRaw);
      if (priceValue == null || priceValue < 0) {
        throw FormatException('Row ${rowIndex + 1}: Price must be a positive number.');
      }

      final stockRaw = _readCell(cells, headerIndex, 'stockquantity');
      final int stockQuantity;
      if (stockRaw.isEmpty) {
        stockQuantity = 0;
      } else {
        final parsed = int.tryParse(stockRaw);
        if (parsed == null || parsed < 0) {
          throw FormatException('Row ${rowIndex + 1}: Stock quantity must be a non-negative integer.');
        }
        stockQuantity = parsed;
      }

      final taxRaw = _readCell(cells, headerIndex, 'taxpercentage');
      final double taxPercentage;
      if (taxRaw.isEmpty) {
        taxPercentage = 0;
      } else {
        final parsed = double.tryParse(taxRaw);
        if (parsed == null || parsed < 0 || parsed > 28) {
          throw FormatException('Row ${rowIndex + 1}: Tax percentage must be between 0 and 28.');
        }
        taxPercentage = parsed;
      }

      final mrpRaw = _readCell(cells, headerIndex, 'mrp');
      final mrpValue = mrpRaw.isEmpty ? null : double.tryParse(mrpRaw);
      if (mrpRaw.isNotEmpty && (mrpValue == null || mrpValue < 0)) {
        throw FormatException('Row ${rowIndex + 1}: MRP must be a non-negative number.');
      }

      final unitCell = _readCell(cells, headerIndex, 'unit');
      final unit = unitCell.isEmpty ? 'pcs' : unitCell;
      final barcode = _readCell(cells, headerIndex, 'barcode');

      items.add(
        InventoryItemRequest(
          sku: sku,
          name: name,
          price: priceValue,
          mrp: mrpValue,
          taxPercentage: taxPercentage,
          stockQuantity: stockQuantity,
          unit: unit,
          barcode: barcode.isEmpty ? null : barcode,
        ),
      );
    }

    if (items.isEmpty) {
      throw const FormatException('No data rows found in CSV.');
    }

    return items;
  }

  static List<String> _parseLine(String line) {
    final result = <String>[];
    final buffer = StringBuffer();
    var inQuotes = false;

    for (var i = 0; i < line.length; i++) {
      final char = line[i];
      if (char == '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] == '"') {
          buffer.write('"');
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char == ',' && !inQuotes) {
        result.add(buffer.toString().trim());
        buffer.clear();
      } else {
        buffer.write(char);
      }
    }
    result.add(buffer.toString().trim());
    return result;
  }

  static String _readCell(
    List<String> cells,
    Map<String, int> headerIndex,
    String key,
  ) {
    final index = headerIndex[key.toLowerCase()];
    if (index == null || index >= cells.length) {
      return '';
    }
    return cells[index].trim();
  }
}
