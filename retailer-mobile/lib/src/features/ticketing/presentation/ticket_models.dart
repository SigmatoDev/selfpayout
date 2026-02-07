class TicketDetail {
  const TicketDetail({
    required this.title,
    required this.venue,
    required this.date,
    required this.price,
    required this.owner,
    required this.imageUrl,
    required this.gallery,
    required this.location,
    required this.attractions,
    required this.ticketsLeft,
    required this.tickets,
    required this.sellerName,
    required this.sellerRating,
    required this.id,
  });

  final String id;
  final String title;
  final String venue;
  final String date;
  final double price;
  final String owner;
  final String imageUrl;
  final List<String> gallery;
  final String location;
  final List<String> attractions;
  final int ticketsLeft;
  final List<TicketTier> tickets;
  final String sellerName;
  final double sellerRating;

  factory TicketDetail.fromJson(Map<String, dynamic> json) => TicketDetail(
        id: json['id'] as String? ?? '',
        title: json['title'] as String? ?? '',
        venue: json['venue'] as String? ?? '',
        date: json['dateLabel'] as String? ?? '',
        price: (json['price'] as num?)?.toDouble() ?? 0,
        owner: json['owner'] as String? ?? '',
        imageUrl: json['imageUrl'] as String? ?? '',
        gallery: (json['gallery'] as List<dynamic>? ?? []).map((item) => item.toString()).toList(),
        location: json['location'] as String? ?? '',
        attractions: (json['attractions'] as List<dynamic>? ?? []).map((item) => item.toString()).toList(),
        ticketsLeft: (json['ticketsLeft'] as num?)?.toInt() ?? 0,
        tickets: (json['tiers'] as List<dynamic>? ?? [])
            .map((item) => TicketTier.fromJson(item as Map<String, dynamic>))
            .toList(),
        sellerName: json['sellerName'] as String? ?? '',
        sellerRating: (json['sellerRating'] as num?)?.toDouble() ?? 0,
      );
}

class TicketTier {
  const TicketTier({
    required this.label,
    required this.price,
    required this.mrp,
    required this.available,
    required this.id,
  });

  final String id;
  final String label;
  final double price;
  final double mrp;
  final int available;

  factory TicketTier.fromJson(Map<String, dynamic> json) => TicketTier(
        id: json['id'] as String? ?? '',
        label: json['label'] as String? ?? '',
        price: (json['price'] as num?)?.toDouble() ?? 0,
        mrp: (json['mrp'] as num?)?.toDouble() ?? 0,
        available: (json['available'] as num?)?.toInt() ?? 0,
      );
}
