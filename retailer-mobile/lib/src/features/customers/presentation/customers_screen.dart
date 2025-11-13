import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../models/models.dart';
import '../../workspace/workspace_providers.dart';
import '../../../core/di/providers.dart';

class CustomersScreen extends ConsumerStatefulWidget {
  const CustomersScreen({super.key});

  @override
  ConsumerState<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends ConsumerState<CustomersScreen> {
  bool _showForm = false;
  bool _isSubmitting = false;
  String? _feedback;

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final customersAsync = ref.watch(customersProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(customersProvider),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Customer ledger', style: Theme.of(context).textTheme.titleLarge),
              OutlinedButton.icon(
                onPressed: () => setState(() => _showForm = !_showForm),
                icon: Icon(_showForm ? Icons.close : Icons.add),
                label: Text(_showForm ? 'Cancel' : 'Add customer'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_showForm) _buildForm(),
          const SizedBox(height: 16),
          customersAsync.when(
            data: (customers) => _buildList(customers),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Text(error.toString(), style: const TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: 'Phone'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email (optional)'),
            ),
            const SizedBox(height: 12),
            if (_feedback != null)
              Text(
                _feedback!,
                style: TextStyle(color: _isSubmitting ? Colors.grey : Colors.redAccent, fontSize: 12),
              ),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _handleSubmit,
                child: _isSubmitting
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Save'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildList(List<Customer> customers) {
    if (customers.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: Text('No customers yet.')),
      );
    }
    return Column(
      children: customers
          .map(
            (customer) => Card(
              margin: const EdgeInsets.symmetric(vertical: 6),
              child: ListTile(
                title: Text(customer.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(customer.phone),
                    if (customer.email != null) Text(customer.email!, style: const TextStyle(fontSize: 12)),
                  ],
                ),
                trailing: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Balance', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    Text(
                      customer.balanceAmount > 0
                          ? '₹${customer.balanceAmount.toStringAsFixed(2)}'
                          : 'Settled',
                      style: TextStyle(
                        color: customer.balanceAmount > 0 ? Colors.amber : Colors.greenAccent.shade400,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }

  Future<void> _handleSubmit() async {
    if (_nameController.text.trim().isEmpty || _phoneController.text.trim().isEmpty) {
      setState(() => _feedback = 'Name and phone are required.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _feedback = null;
    });
    try {
      await ref.read(retailerApiProvider).addCustomer(
            CustomerPayload(
              name: _nameController.text.trim(),
              phone: _phoneController.text.trim(),
              email: _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
            ),
          );
      setState(() {
        _isSubmitting = false;
        _feedback = 'Customer added.';
        _nameController.clear();
        _phoneController.clear();
        _emailController.clear();
      });
      ref.invalidate(customersProvider);
    } on ApiException catch (error) {
      setState(() {
        _isSubmitting = false;
        _feedback = error.message;
      });
    }
  }
}
