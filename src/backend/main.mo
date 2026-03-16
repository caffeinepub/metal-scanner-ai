import Map "mo:core/Map";
import List "mo:core/List";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";


import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// Specify the migration function in with-clause

actor {
  // Extended MetalType enumeration
  public type MetalType = {
    #gold;
    #silver;
    #copper;
    #steel;
    #zinc;
    #aluminium;
    #titanium;
    #nickel;
    #lead;
    #unknown;
    #autoDetect;
  };

  // Metal analysis result type with enhanced confidence metrics
  public type MetalAnalysisResult = {
    goldProbability : Nat;
    silverProbability : Nat;
    copperProbability : Nat;
    steelProbability : Nat;
    zincProbability : Nat;
    aluminiumProbability : Nat;
    titaniumProbability : Nat;
    nickelProbability : Nat;
    leadProbability : Nat;
    purityEstimate : ?Nat;
    estimatedValueUSD : ?Nat;
    confidenceScore : Nat;
    metalType : MetalType;
    analysisTimestamp : Int;
    disclaimer : Text;
  };

  // Scan record with new evaluation metrics and analysis results
  public type ScanRecord = {
    id : Nat;
    user : Principal;
    selectedMetal : MetalType;
    images : [Storage.ExternalBlob];
    weightGrams : ?Float;
    dimensions : ?(Float, Float, Float);
    analysisResult : MetalAnalysisResult;
    timestamp : Int;
  };

  module ScanRecord {
    public func compareByTimestamp(x : ScanRecord, y : ScanRecord) : Order.Order {
      Int.compare(x.timestamp, y.timestamp);
    };
  };

  // Metal price management for supported metals
  public type MetalPrice = {
    pricePerGramUSD : Float;
    lastUpdated : Int;
  };

  public type MetalPrices = {
    gold : MetalPrice;
    silver : MetalPrice;
    copper : MetalPrice;
    steel : MetalPrice;
    zinc : MetalPrice;
    aluminium : MetalPrice;
    titanium : MetalPrice;
    nickel : MetalPrice;
    lead : MetalPrice;
  };

  // User profile
  public type UserProfile = {
    name : Text;
  };

  // Explicitly define persistent data structures as fields
  let scanHistory = Map.empty<Principal, List.List<ScanRecord>>();
  let metalPrices = Map.empty<Text, MetalPrice>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextScanId : Nat = 1;

  // Initialization of prefabricated modules
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    checkUser(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    checkUser(caller);
    userProfiles.add(caller, profile);
  };

  // Metal price management
  public shared ({ caller }) func updateMetalPrices(newPrices : MetalPrices) : async () {
    checkAdmin(caller);

    metalPrices.add("gold", newPrices.gold);
    metalPrices.add("silver", newPrices.silver);
    metalPrices.add("copper", newPrices.copper);
    metalPrices.add("steel", newPrices.steel);
    metalPrices.add("zinc", newPrices.zinc);
    metalPrices.add("aluminium", newPrices.aluminium);
    metalPrices.add("titanium", newPrices.titanium);
    metalPrices.add("nickel", newPrices.nickel);
    metalPrices.add("lead", newPrices.lead);
  };

  public query func getCurrentMetalPrices() : async MetalPrices {
    // No authorization check - metal prices are public market data accessible to all users including guests

    let goldPrice = metalPrices.get("gold");
    let silverPrice = metalPrices.get("silver");
    let copperPrice = metalPrices.get("copper");
    let steelPrice = metalPrices.get("steel");
    let zincPrice = metalPrices.get("zinc");
    let aluminiumPrice = metalPrices.get("aluminium");
    let titaniumPrice = metalPrices.get("titanium");
    let nickelPrice = metalPrices.get("nickel");
    let leadPrice = metalPrices.get("lead");

    switch (goldPrice, silverPrice, copperPrice, steelPrice, zincPrice, aluminiumPrice, titaniumPrice, nickelPrice, leadPrice) {
      case (null, _, _, _, _, _, _, _, _) { Runtime.trap("Gold price not found") };
      case (_, null, _, _, _, _, _, _, _) { Runtime.trap("Silver price not found") };
      case (_, _, null, _, _, _, _, _, _) { Runtime.trap("Copper price not found") };
      case (_, _, _, null, _, _, _, _, _) { Runtime.trap("Steel price not found") };
      case (_, _, _, _, null, _, _, _, _) { Runtime.trap("Zinc price not found") };
      case (_, _, _, _, _, null, _, _, _) { Runtime.trap("Aluminium price not found") };
      case (_, _, _, _, _, _, null, _, _) { Runtime.trap("Titanium price not found") };
      case (_, _, _, _, _, _, _, null, _) { Runtime.trap("Nickel price not found") };
      case (_, _, _, _, _, _, _, _, null) { Runtime.trap("Lead price not found") };
      case (?g, ?s, ?c, ?steel, ?zinc, ?aluminium, ?titanium, ?nickel, ?lead) {
        {
          gold = g;
          silver = s;
          copper = c;
          steel;
          zinc;
          aluminium;
          titanium;
          nickel;
          lead;
        };
      };
    };
  };

  // Scan history management
  public shared ({ caller }) func saveScan(
    selectedMetal : MetalType,
    images : [Storage.ExternalBlob],
    weightGrams : ?Float,
    dimensions : ?(Float, Float, Float),
    analysisResult : MetalAnalysisResult,
  ) : async Nat {
    checkUser(caller);

    let newScanId = nextScanId;
    nextScanId += 1;

    let scanRecord : ScanRecord = {
      id = newScanId;
      user = caller;
      selectedMetal;
      images;
      weightGrams;
      dimensions;
      analysisResult;
      timestamp = Time.now();
    };

    let existingHistory = switch (scanHistory.get(caller)) {
      case (null) { List.empty<ScanRecord>() };
      case (?history) { history };
    };

    let currentList = List.empty<ScanRecord>();
    currentList.add(scanRecord);
    existingHistory.values().forEach(func(scan) { currentList.add(scan) });

    scanHistory.add(caller, currentList);

    newScanId;
  };

  public query ({ caller }) func getScanHistory(user : Principal) : async [ScanRecord] {
    checkReadAccess(caller, user);

    let history = switch (scanHistory.get(user)) {
      case (null) { List.empty<ScanRecord>() };
      case (?h) { h };
    };

    let iter = history.values();
    iter.toArray().sort(ScanRecord.compareByTimestamp);
  };

  public query ({ caller }) func getScanById(user : Principal, scanId : Nat) : async ScanRecord {
    checkReadAccess(caller, user);

    switch (scanHistory.get(user)) {
      case (null) { Runtime.trap("User scan history not found") };
      case (?history) {
        switch (history.find(func(scan) { scan.id == scanId })) {
          case (null) { Runtime.trap("Scan not found") };
          case (?scan) { scan };
        };
      };
    };
  };

  public query ({ caller }) func getUserScanCount(user : Principal) : async Nat {
    checkReadAccess(caller, user);

    switch (scanHistory.get(user)) {
      case (null) { 0 };
      case (?history) { history.size() };
    };
  };

  // Internal helper functions
  func checkUser(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access this function");
    };
  };

  func checkAdmin(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  func checkReadAccess(caller : Principal, user : Principal) {
    // Ensure caller is at least a user (not a guest)
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access scan data");
    };
    
    // Allow users to view their own data, or admins to view any user's data
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own scan data");
    };
  };
};
