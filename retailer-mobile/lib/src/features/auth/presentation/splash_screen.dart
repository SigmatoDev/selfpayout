import 'package:flutter/material.dart';

class AppSplashScreen extends StatelessWidget {
  const AppSplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFD00000),
      body: SafeArea(
        child: Stack(
          children: [
            Center(
              child: SizedBox(
                width: 120,
                height: 120,
                child: Image.asset(
                  'assets/icon/app_icon.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
            const Positioned(
              bottom: 32,
              left: 0,
              right: 0,
              child: Center(
                child: SizedBox(
                  height: 28,
                  width: 28,
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    strokeWidth: 2.4,
                  ),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
