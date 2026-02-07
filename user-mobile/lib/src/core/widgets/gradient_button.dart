import 'package:flutter/material.dart';

class AppGradientButton extends StatelessWidget {
  const AppGradientButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.padding = const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
    this.borderRadius = 12,
    this.minHeight = 48,
  });

  final VoidCallback? onPressed;
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final double minHeight;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isEnabled = onPressed != null;
    final contentColor = isEnabled ? colorScheme.onPrimary : colorScheme.onSurfaceVariant;
    final gradient = isEnabled
        ? LinearGradient(
            colors: [
              colorScheme.primary,
              colorScheme.secondary,
            ],
          )
        : LinearGradient(
            colors: [
              colorScheme.surfaceVariant,
              colorScheme.surfaceVariant,
            ],
          );

    return ConstrainedBox(
      constraints: BoxConstraints(minHeight: minHeight),
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(borderRadius),
          boxShadow: isEnabled
              ? [
                  BoxShadow(
                    color: colorScheme.primary.withValues(alpha: 0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ]
              : null,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(borderRadius),
            onTap: onPressed,
            child: Padding(
              padding: padding,
              child: Center(
                child: IconTheme(
                  data: IconThemeData(color: contentColor),
                  child: DefaultTextStyle.merge(
                    style: Theme.of(context)
                        .textTheme
                        .labelLarge
                        ?.copyWith(color: contentColor, fontWeight: FontWeight.w600),
                    child: child,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
