import 'package:flutter/material.dart';

import 'ticket_models.dart';

class TicketDetailScreen extends StatefulWidget {
  const TicketDetailScreen({super.key, required this.ticket});

  final TicketDetail ticket;

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final ticket = widget.ticket;
    final minPrice = ticket.tickets.map((tier) => tier.price).reduce((a, b) => a < b ? a : b);
    final maxPrice = ticket.tickets.map((tier) => tier.price).reduce((a, b) => a > b ? a : b);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Event details'),
        backgroundColor: Colors.white,
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
          decoration: const BoxDecoration(
            color: Color(0xFFFDE047),
            border: Border(top: BorderSide(color: Color(0xFFFCD34D))),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '₹${minPrice.toStringAsFixed(0)} - ₹${maxPrice.toStringAsFixed(0)}',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Ticket booked successfully')),
                  );
                },
                child: const Text('Buy ticket'),
              ),
            ],
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
        children: [
          SizedBox(
            height: 220,
            child: Stack(
              children: [
                PageView.builder(
                  itemCount: ticket.gallery.length,
                  onPageChanged: (index) => setState(() => _currentIndex = index),
                  itemBuilder: (context, index) {
                    return ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: Image.network(
                        ticket.gallery[index],
                        fit: BoxFit.cover,
                        width: double.infinity,
                      ),
                    );
                  },
                ),
                Positioned(
                  bottom: 12,
                  left: 0,
                  right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(ticket.gallery.length, (index) {
                      final isActive = index == _currentIndex;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        height: 6,
                        width: isActive ? 18 : 6,
                        decoration: BoxDecoration(
                          color: isActive ? Colors.white : Colors.white70,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(ticket.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(ticket.date, style: const TextStyle(color: Colors.black54)),
          const SizedBox(height: 14),
          _InfoCard(
            title: 'Event details',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _InfoRow(icon: Icons.place_outlined, label: ticket.venue),
                const SizedBox(height: 8),
                _InfoRow(icon: Icons.location_on_outlined, label: ticket.location),
              ],
            ),
          ),
          const SizedBox(height: 14),
          _InfoCard(
            title: 'Nearby attractions',
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ticket.attractions
                  .map(
                    (item) => Chip(
                      label: Text(item, style: const TextStyle(fontSize: 12)),
                      backgroundColor: const Color(0xFFF3F4F6),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 14),
          _InfoCard(
            title: 'Tickets',
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Price range', style: TextStyle(fontSize: 12, color: Colors.black54)),
                    const SizedBox(height: 4),
                    Text(
                      '₹${minPrice.toStringAsFixed(0)} - ₹${maxPrice.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Tickets available', style: TextStyle(fontSize: 12, color: Colors.black54)),
                    const SizedBox(height: 4),
                    Text('${ticket.ticketsLeft}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          _InfoCard(
            title: 'Ticket types',
            child: Column(
              children: ticket.tickets
                  .map(
                    (tier) => Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(tier.label, style: const TextStyle(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 4),
                                Text(
                                  '${tier.available} available',
                                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '₹${tier.price.toStringAsFixed(0)}',
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '₹${tier.mrp.toStringAsFixed(0)}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Colors.black45,
                                  decoration: TextDecoration.lineThrough,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 14),
          _InfoCard(
            title: 'Seller information',
            child: Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: const Color(0xFFF1F5F9),
                  child: Text(
                    ticket.sellerName.substring(0, 1).toUpperCase(),
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(ticket.sellerName, style: const TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Text('Rating ${ticket.sellerRating}',
                          style: const TextStyle(fontSize: 12, color: Colors.black54)),
                    ],
                  ),
                ),
                const Icon(Icons.verified, color: Colors.green),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.black54),
        const SizedBox(width: 8),
        Expanded(child: Text(label)),
      ],
    );
  }
}
