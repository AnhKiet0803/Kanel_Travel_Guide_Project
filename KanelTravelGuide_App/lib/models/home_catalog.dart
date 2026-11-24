class HomeCatalog {
  const HomeCatalog(
      {required this.spots,
      required this.tours,
      required this.services,
      required this.promotions});
  final List<Map<String, dynamic>> spots;
  final List<Map<String, dynamic>> tours;
  final List<Map<String, dynamic>> services;
  final List<Map<String, dynamic>> promotions;

  List<Map<String, dynamic>> get featuredSpots =>
      spots.where((s) => s['isFeatured'] == true).toList();
  List<Map<String, dynamic>> get featuredTours =>
      tours.where((t) => t['isFeatured'] == true).toList();
}
