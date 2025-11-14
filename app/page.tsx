"use client";

import { Fragment, useMemo, useState } from "react";

interface MemberData {
  customer_ref?: string;
  mobile?: string;
  email?: string;
  firstname_th?: string;
  lastname_th?: string;
  firstname_en?: string;
  lastname_en?: string;
  member_status?: string;
  account_status?: string;
  last_active_at?: string;
  isMigrated?: boolean;
  migratedData?: MigratedFoodStoryMember;
}

interface MigratedFoodStoryMember {
  phone_no?: number;
  firstname_th?: string;
  lastname_th?: string;
  firstname_en?: string;
  lastname_en?: string;
  current_point?: number;
  tier_id?: number;
  tier_name?: string;
}

interface BillDetail {
  payment_date?: string;
  payment_time?: string;
  payment_id?: number;
  receipt_no?: string;
  tax_inv_no?: string;
  void?: boolean;
  price_before_discount?: number;
  item_discount?: number;
  include_revenue?: boolean;
  fs_crm_member_id?: number;
  cus_crm_member_id?: string;
  customer_phone_number?: string;
  customer_name?: string;
  bill_discounted_price?: number;
  sub_amount?: number;
  sub_before_tax?: number;
  tax?: number;
  rounding_amount?: number;
  voucher_discount?: number;
  net_paid?: number;
  branch_code?: string;
  store_name?: string;
  payment_type?: string;
  order_type?: string;
  promotions?: Promotion[];
}

interface Promotion {
  payment_date?: string;
  payment_time?: string;
  payment_id?: number;
  invoice_item_id?: string;
  receipt_no?: string;
  tax_inv_no?: string;
  void?: boolean;
  promotion_id?: number;
  promotion_type?: string;
  final_pro_ref_code?: string;
  promotion_name?: string;
  bill_discounted_price?: string;
  before_vat?: number;
  vat_amount?: number;
  branch_code?: string;
  store_name?: string;
  payment_type?: string;
  order_type?: string;
}

interface Coupon {
  coupon_code?: string;
  coupon_type?: string;
  coupon_status?: string;
  expired_at?: string;
  redeemed_at?: string;
  used_at?: string;
  campaign?: string;
  brand?: string;
}

interface PointBalance {
  point_balance?: number;
  point_currency?: string;
  expired_date?: string;
  point_type?: string;
}

interface TierMovement {
  log_id?: string;
  customer_ref?: string;
  loyalty_program_id?: number;
  loyalty_program_name?: string;
  tier_group_id?: number;
  tier_group_name?: string;
  tier_id?: number;
  tier_name?: string;
  entry_date?: string;
  expired_date?: string;
  retention_next_expire_date?: number;
  promotion_next_entry_date?: number;
  promotion_next_expire_date?: number;
  previous_tier_id?: number;
  previous_tier_name?: string;
  promotion_next_tier_id?: number;
  promotion_next_tier_name?: string;
  grace_period_start_date?: number;
  grace_period_end_date?: number;
  created_at?: string;
  updated_at?: string;
  owner?: string;
}

export default function Home() {
  const [searchFields, setSearchFields] = useState({
    customer_ref: "",
    mobile: "",
    email: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [billDetails, setBillDetails] = useState<BillDetail[]>([]);
  const [expandedBills, setExpandedBills] = useState<Set<number>>(new Set());
  const [selectedBill, setSelectedBill] = useState<BillDetail | null>(null);
  const [billDateFilter, setBillDateFilter] = useState({
    start: "",
    end: "",
  });
  const [memberCandidates, setMemberCandidates] = useState<MemberData[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [points, setPoints] = useState<PointBalance[]>([]);
  const [tierMovements, setTierMovements] = useState<TierMovement[]>([]);
  const [activeTab, setActiveTab] = useState<
    "info" | "bills" | "coupons" | "points" | "tier"
  >("info");

  const filteredBills = useMemo(() => {
    if (!billDateFilter.start && !billDateFilter.end) {
      return billDetails;
    }

    const startDate = billDateFilter.start
      ? new Date(billDateFilter.start)
      : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);

    const endDate = billDateFilter.end ? new Date(billDateFilter.end) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    return billDetails.filter((bill) => {
      if (!bill.payment_date) {
        return false;
      }

      const paymentDate = new Date(bill.payment_date);
      if (Number.isNaN(paymentDate.getTime())) {
        return false;
      }

      if (startDate && paymentDate < startDate) {
        return false;
      }

      if (endDate && paymentDate > endDate) {
        return false;
      }

      return true;
    });
  }, [billDetails, billDateFilter.start, billDateFilter.end]);

  const hasBillDateFilter =
    billDateFilter.start !== "" || billDateFilter.end !== "";

  const displayedBills = hasBillDateFilter ? filteredBills : billDetails;
  const hasBillResults = displayedBills.length > 0;

  const performSearch = async (
    payload: typeof searchFields,
    options: { validate?: boolean; updateForm?: boolean } = {},
  ) => {
    const { validate = false, updateForm = false } = options;

    if (validate) {
      const hasValue = Object.values(payload).some((val) => val.trim() !== "");
      if (!hasValue) {
        setError("กรุณากรอกข้อมูลอย่างน้อย 1 ช่อง");
        return;
      }
    }

    if (updateForm) {
      setSearchFields(payload);
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/search-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการค้นหา");
      }

      setMemberData(data.member);
      setMemberCandidates(data.members || (data.member ? [data.member] : []));
      setBillDetails(data.bills || []);
      setCoupons(data.coupons || []);
      setPoints(data.points || []);
      setTierMovements(data.tierMovements || []);

      // Debug logging
      console.log("Coupons received:", data.coupons?.length || 0);
      if (data.coupons && data.coupons.length > 0) {
        console.log("Sample coupon data:", data.coupons[0]);
      }
    } catch (error) {
      console.error("Search error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการค้นหา";
      setError(errorMessage);
      setMemberData(null);
      setMemberCandidates([]);
      setBillDetails([]);
      setCoupons([]);
      setPoints([]);
      setTierMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(searchFields, { validate: true });
  };

  const handleCandidateSelect = async (candidate: MemberData) => {
    const payload = {
      customer_ref: candidate.customer_ref || "",
      mobile: candidate.mobile || "",
      email: candidate.email || "",
      name: "",
    };
    await performSearch(payload, { updateForm: true });
  };

  const handleClear = () => {
    setSearchFields({
      customer_ref: "",
      mobile: "",
      email: "",
      name: "",
    });
    setMemberData(null);
    setMemberCandidates([]);
    setBillDetails([]);
    setCoupons([]);
    setPoints([]);
    setTierMovements([]);
    setSelectedBill(null);
    setExpandedBills(new Set());
    setBillDateFilter({ start: "", end: "" });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CRM Member Search
          </h1>
          <p className="text-gray-600">ค้นหาและดูข้อมูลสมาชิก CRM</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Reference
                </label>
                <input
                  type="text"
                  value={searchFields.customer_ref}
                  onChange={(e) =>
                    setSearchFields({
                      ...searchFields,
                      customer_ref: e.target.value,
                    })
                  }
                  placeholder="กรอก Customer Reference"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="text"
                  value={searchFields.mobile}
                  onChange={(e) =>
                    setSearchFields({ ...searchFields, mobile: e.target.value })
                  }
                  placeholder="กรอกเบอร์โทรศัพท์"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={searchFields.email}
                  onChange={(e) =>
                    setSearchFields({ ...searchFields, email: e.target.value })
                  }
                  placeholder="กรอกอีเมล"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  value={searchFields.name}
                  onChange={(e) =>
                    setSearchFields({ ...searchFields, name: e.target.value })
                  }
                  placeholder="กรอกชื่อ-นามสกุล"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                ล้างข้อมูล
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {memberData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex -mb-px overflow-x-auto">
                {[
                  { id: "info", label: "ข้อมูลสมาชิก" },
                  { id: "bills", label: "รายการบิล" },
                  { id: "coupons", label: "คูปอง" },
                  { id: "points", label: "คะแนน" },
                  { id: "tier", label: "Tier Movement" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(
                        tab.id as
                          | "info"
                          | "bills"
                          | "coupons"
                          | "points"
                          | "tier",
                      )
                    }
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600 bg-white"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Member Info Tab */}
              {activeTab === "info" && (
                <div className="space-y-6">
                  {memberData.isMigrated && memberData.migratedData && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-amber-600 font-semibold">
                          ⚠️ Migrated Member
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-amber-200 text-amber-800 rounded">
                          Migrated from Food Story
                        </span>
                      </div>
                      <p className="text-sm text-amber-700">
                        สมาชิกคนนี้ถูก migrate จาก Food Story
                      </p>
                    </div>
                  )}
                  {memberCandidates.length > 1 && (
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-blue-800">
                            พบผลการค้นหา {memberCandidates.length} รายการ
                          </p>
                          <p className="text-xs text-blue-700">
                            เลือกสมาชิกที่ต้องการเพื่อดูรายละเอียด
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {memberCandidates.map((candidate) => {
                          const isActive =
                            candidate.customer_ref === memberData.customer_ref;
                          const displayName =
                            candidate.firstname_th || candidate.firstname_en
                              ? `${
                                  candidate.firstname_th ||
                                  candidate.firstname_en ||
                                  "-"
                                } ${
                                  candidate.lastname_th ||
                                  candidate.lastname_en ||
                                  ""
                                }`.trim()
                              : candidate.customer_ref || "-";
                          return (
                            <button
                              key={`${candidate.customer_ref}-${candidate.mobile}`}
                              onClick={() => handleCandidateSelect(candidate)}
                              className={`text-left rounded-lg border px-4 py-3 bg-white transition-all ${
                                isActive
                                  ? "border-blue-500 shadow-sm ring-1 ring-blue-300"
                                  : "border-transparent hover:border-blue-200 hover:shadow-sm"
                              }`}
                            >
                              <p className="text-sm font-semibold text-gray-900">
                                {displayName}
                              </p>
                              <p className="text-xs text-gray-500">
                                Phone: {candidate.mobile || "-"}
                              </p>
                              <p className="text-xs text-gray-400">
                                Customer Ref: {candidate.customer_ref || "-"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        ข้อมูลพื้นฐาน
                      </h3>
                      <dl className="space-y-4">
                        <div className="border-b border-gray-200 pb-3">
                          <dt className="text-sm font-medium text-gray-500 mb-1">
                            Customer Reference
                          </dt>
                          <dd className="text-base text-gray-900">
                            {memberData.customer_ref || "-"}
                          </dd>
                        </div>
                        <div className="border-b border-gray-200 pb-3">
                          <dt className="text-sm font-medium text-gray-500 mb-1">
                            เบอร์โทรศัพท์
                          </dt>
                          <dd className="text-base text-gray-900">
                            {memberData.mobile || "-"}
                          </dd>
                        </div>
                        <div className="border-b border-gray-200 pb-3">
                          <dt className="text-sm font-medium text-gray-500 mb-1">
                            อีเมล
                          </dt>
                          <dd className="text-base text-gray-900 break-all">
                            {memberData.email || "-"}
                          </dd>
                        </div>
                        <div className="border-b border-gray-200 pb-3">
                          <dt className="text-sm font-medium text-gray-500 mb-1">
                            ชื่อ-นามสกุล (ไทย)
                          </dt>
                          <dd className="text-base text-gray-900">
                            {memberData.firstname_th || "-"}{" "}
                            {memberData.lastname_th || ""}
                          </dd>
                        </div>
                        <div className="pb-3">
                          <dt className="text-sm font-medium text-gray-500 mb-1">
                            ชื่อ-นามสกุล (อังกฤษ)
                          </dt>
                          <dd className="text-base text-gray-900">
                            {memberData.firstname_en || "-"}{" "}
                            {memberData.lastname_en || ""}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        สถานะ
                      </h3>
                      <dl className="space-y-4">
                        <div className="border-b border-gray-200 pb-3">
                          <dt className="text-sm font-medium text-gray-500 mb-2">
                            สถานะบัญชี
                          </dt>
                          <dd className="mt-1">
                            <span
                              className={`inline-flex px-3 py-1 text-sm font-medium rounded-md ${
                                memberData.account_status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {memberData.account_status || "-"}
                            </span>
                          </dd>
                        </div>
                        <div className="pb-3">
                          <dt className="text-sm font-medium text-gray-500 mb-1">
                            ใช้งานล่าสุด
                          </dt>
                          <dd className="text-base text-gray-900">
                            {memberData.last_active_at
                              ? new Date(
                                  memberData.last_active_at,
                                ).toLocaleString("th-TH")
                              : "-"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Migrated Data Section */}
                  {memberData.isMigrated && memberData.migratedData && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        ข้อมูล Food Story เก่า
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <dt className="text-xs font-medium text-gray-500 mb-1">
                            ชื่อ-นามสกุล (ไทย)
                          </dt>
                          <dd className="text-base font-semibold text-gray-900">
                            {memberData.migratedData.firstname_th || "-"}{" "}
                            {memberData.migratedData.lastname_th || ""}
                          </dd>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <dt className="text-xs font-medium text-gray-500 mb-1">
                            ชื่อ-นามสกุล (อังกฤษ)
                          </dt>
                          <dd className="text-base font-semibold text-gray-900">
                            {memberData.migratedData.firstname_en || "-"}{" "}
                            {memberData.migratedData.lastname_en || ""}
                          </dd>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <dt className="text-xs font-medium text-gray-500 mb-1">
                            Phone No
                          </dt>
                          <dd className="text-base font-semibold text-gray-900">
                            {memberData.migratedData.phone_no || "-"}
                          </dd>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <dt className="text-xs font-medium text-gray-500 mb-1">
                            Current Point
                          </dt>
                          <dd className="text-lg font-bold text-blue-600">
                            {memberData.migratedData.current_point
                              ? memberData.migratedData.current_point.toLocaleString(
                                  "th-TH",
                                )
                              : "-"}
                          </dd>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <dt className="text-xs font-medium text-gray-500 mb-1">
                            Tier ID
                          </dt>
                          <dd className="text-base font-semibold text-gray-900">
                            {memberData.migratedData.tier_id || "-"}
                          </dd>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <dt className="text-xs font-medium text-gray-500 mb-1">
                            Tier Name
                          </dt>
                          <dd className="text-base font-semibold text-gray-900">
                            {memberData.migratedData.tier_name ? (
                              <span className="px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
                                {memberData.migratedData.tier_name}
                              </span>
                            ) : (
                              "-"
                            )}
                          </dd>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bills Tab */}
              {activeTab === "bills" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    รายการบิล
                  </h3>

                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ตั้งแต่วันที่
                        </label>
                        <input
                          type="date"
                          value={billDateFilter.start}
                          onChange={(e) =>
                            setBillDateFilter((prev) => ({
                              ...prev,
                              start: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ถึงวันที่
                        </label>
                        <input
                          type="date"
                          value={billDateFilter.end}
                          onChange={(e) =>
                            setBillDateFilter((prev) => ({
                              ...prev,
                              end: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBillDateFilter({ start: "", end: "" });
                          setExpandedBills(new Set());
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50"
                        disabled={!hasBillDateFilter}
                      >
                        ล้างตัวกรอง
                      </button>
                    </div>
                  </div>

                  {hasBillResults ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Receipt No
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Store
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Net Paid
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Promotions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {displayedBills.map((bill, idx) => {
                            const billId = bill.payment_id || idx;
                            const isExpanded = expandedBills.has(billId);
                            const hasPromotions =
                              bill.promotions && bill.promotions.length > 0;

                            return (
                              <Fragment key={billId}>
                                <tr
                                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                                  onClick={() => setSelectedBill(bill)}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {bill.payment_date || "-"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {bill.receipt_no || "-"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {bill.store_name || "-"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {bill.payment_type || "-"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {bill.net_paid
                                      ? `฿${bill.net_paid.toLocaleString(
                                          "th-TH",
                                        )}`
                                      : "-"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {hasPromotions ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newExpanded = new Set(
                                            expandedBills,
                                          );
                                          if (isExpanded) {
                                            newExpanded.delete(billId);
                                          } else {
                                            newExpanded.add(billId);
                                          }
                                          setExpandedBills(newExpanded);
                                        }}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:border-blue-300 hover:bg-blue-100 transition-colors"
                                      >
                                        <span>
                                          {bill.promotions?.length} รายการ
                                        </span>
                                        <span
                                          className={`transition-transform ${
                                            isExpanded ? "rotate-180" : ""
                                          }`}
                                        >
                                          ▾
                                        </span>
                                      </button>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                </tr>
                                {isExpanded && hasPromotions && (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="px-6 py-4 bg-slate-50 border-t border-slate-200"
                                    >
                                      <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2">
                                          Promotion ที่ใช้ในบิลนี้:
                                        </h4>
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-slate-100">
                                              <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                                                  Promotion Name
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                                                  Type
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                                                  Discount Price
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                                                  Before VAT
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                                                  VAT Amount
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                                                  Ref Code
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                              {bill.promotions?.map(
                                                (promo, promoIdx) => (
                                                  <tr
                                                    key={promoIdx}
                                                    className="hover:bg-slate-50"
                                                  >
                                                    <td className="px-4 py-2 text-sm text-gray-900">
                                                      {promo.promotion_name ||
                                                        "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-900">
                                                      {promo.promotion_type ||
                                                        "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-900">
                                                      {promo.bill_discounted_price ||
                                                        "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-900">
                                                      {promo.before_vat
                                                        ? `฿${promo.before_vat.toLocaleString(
                                                            "th-TH",
                                                          )}`
                                                        : "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-900">
                                                      {promo.vat_amount
                                                        ? `฿${promo.vat_amount.toLocaleString(
                                                            "th-TH",
                                                          )}`
                                                        : "-"}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-900">
                                                      {promo.final_pro_ref_code ||
                                                        "-"}
                                                    </td>
                                                  </tr>
                                                ),
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-gray-200 rounded-md bg-gray-50">
                      <p className="text-gray-500">
                        {hasBillDateFilter
                          ? "ไม่พบข้อมูลบิลตามช่วงวันที่ที่เลือก"
                          : "ไม่มีข้อมูลบิล"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Coupons Tab */}
              {activeTab === "coupons" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    คูปอง
                  </h3>
                  {coupons.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Coupon Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Campaign
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Expired At
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Used At
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {coupons.map((coupon, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {coupon.coupon_code || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {coupon.coupon_type || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${
                                    coupon.coupon_status === "used"
                                      ? "bg-green-100 text-green-800"
                                      : coupon.coupon_status === "expired"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {coupon.coupon_status || "-"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {coupon.campaign || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {coupon.expired_at
                                  ? new Date(
                                      coupon.expired_at,
                                    ).toLocaleDateString("th-TH")
                                  : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {coupon.used_at
                                  ? new Date(coupon.used_at).toLocaleDateString(
                                      "th-TH",
                                    )
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-gray-200 rounded-md bg-gray-50">
                      <p className="text-gray-500">ไม่มีข้อมูลคูปอง</p>
                    </div>
                  )}
                </div>
              )}

              {/* Points Tab */}
              {activeTab === "points" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    คะแนน
                  </h3>
                  {points.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Point Balance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Currency
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Point Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Expired Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {points.map((point, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {point.point_balance
                                  ? point.point_balance.toLocaleString("th-TH")
                                  : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {point.point_currency || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {point.point_type || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {point.expired_date
                                  ? new Date(
                                      point.expired_date,
                                    ).toLocaleDateString("th-TH")
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-gray-200 rounded-md bg-gray-50">
                      <p className="text-gray-500">ไม่มีข้อมูลคะแนน</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tier Movement Tab */}
              {activeTab === "tier" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tier Movement
                  </h3>
                  {tierMovements.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Entry Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Loyalty Program
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tier Group
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Current Tier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Previous Tier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Expired Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Next Tier
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {tierMovements.map((tier, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {tier.entry_date
                                  ? new Date(
                                      tier.entry_date,
                                    ).toLocaleDateString("th-TH")
                                  : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {tier.loyalty_program_name || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {tier.tier_group_name || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                  {tier.tier_name || "-"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {tier.previous_tier_name || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {tier.expired_date
                                  ? new Date(
                                      tier.expired_date,
                                    ).toLocaleDateString("th-TH")
                                  : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {tier.promotion_next_tier_name || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-gray-200 rounded-md bg-gray-50">
                      <p className="text-gray-500">ไม่มีข้อมูล Tier Movement</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!memberData && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">
              กรุณากรอกข้อมูลที่ต้องการค้นหาเพื่อดูข้อมูลสมาชิก CRM
            </p>
          </div>
        )}

        {/* Bill Detail Modal */}
        {selectedBill && (
          <div
            className="fixed inset-0 bg-[#00000045] bg-opacity-30 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBill(null)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  รายละเอียดบิล
                </h2>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      ข้อมูลบิล
                    </h3>
                    <dl className="space-y-3">
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Payment ID
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.payment_id || "-"}
                        </dd>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Receipt No
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.receipt_no || "-"}
                        </dd>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Tax Invoice No
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.tax_inv_no || "-"}
                        </dd>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Payment Date
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.payment_date || "-"}
                        </dd>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Payment Time
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.payment_time || "-"}
                        </dd>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Store
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.store_name || "-"}
                        </dd>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Branch Code
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.branch_code || "-"}
                        </dd>
                      </div>
                      <div className="pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Void
                        </dt>
                        <dd className="text-base">
                          {selectedBill.void ? (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                              Yes
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              No
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      ข้อมูลลูกค้า
                    </h3>
                    <dl className="space-y-3">
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Customer Name
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.customer_name || "-"}
                        </dd>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Customer Phone
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.customer_phone_number || "-"}
                        </dd>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Customer CRM Member ID
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.cus_crm_member_id || "-"}
                        </dd>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          FS CRM Member ID
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.fs_crm_member_id || "-"}
                        </dd>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Payment Type
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.payment_type || "-"}
                        </dd>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Order Type
                        </dt>
                        <dd className="text-base text-gray-900">
                          {selectedBill.order_type || "-"}
                        </dd>
                      </div>
                      <div className="pb-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">
                          Include Revenue
                        </dt>
                        <dd className="text-base">
                          {selectedBill.include_revenue ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              Yes
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                              No
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ข้อมูลการชำระเงิน
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <dt className="text-xs font-medium text-gray-500 mb-1">
                        Price Before Discount
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {selectedBill.price_before_discount
                          ? `฿${selectedBill.price_before_discount.toLocaleString(
                              "th-TH",
                            )}`
                          : "-"}
                      </dd>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <dt className="text-xs font-medium text-gray-500 mb-1">
                        Item Discount
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {selectedBill.item_discount
                          ? `฿${selectedBill.item_discount.toLocaleString(
                              "th-TH",
                            )}`
                          : "-"}
                      </dd>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <dt className="text-xs font-medium text-gray-500 mb-1">
                        Bill Discounted Price
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {selectedBill.bill_discounted_price
                          ? `฿${selectedBill.bill_discounted_price.toLocaleString(
                              "th-TH",
                            )}`
                          : "-"}
                      </dd>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <dt className="text-xs font-medium text-gray-500 mb-1">
                        Voucher Discount
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {selectedBill.voucher_discount
                          ? `฿${selectedBill.voucher_discount.toLocaleString(
                              "th-TH",
                            )}`
                          : "-"}
                      </dd>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <dt className="text-xs font-medium text-gray-500 mb-1">
                        Sub Amount
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {selectedBill.sub_amount
                          ? `฿${selectedBill.sub_amount.toLocaleString(
                              "th-TH",
                            )}`
                          : "-"}
                      </dd>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <dt className="text-xs font-medium text-gray-500 mb-1">
                        Sub Before Tax
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {selectedBill.sub_before_tax
                          ? `฿${selectedBill.sub_before_tax.toLocaleString(
                              "th-TH",
                            )}`
                          : "-"}
                      </dd>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <dt className="text-xs font-medium text-gray-500 mb-1">
                        Tax
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {selectedBill.tax
                          ? `฿${selectedBill.tax.toLocaleString("th-TH")}`
                          : "-"}
                      </dd>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <dt className="text-xs font-medium text-blue-700 mb-1">
                        Net Paid
                      </dt>
                      <dd className="text-xl font-bold text-blue-900">
                        {selectedBill.net_paid
                          ? `฿${selectedBill.net_paid.toLocaleString("th-TH")}`
                          : "-"}
                      </dd>
                    </div>
                  </div>
                </div>

                {selectedBill.promotions &&
                  selectedBill.promotions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Promotion ที่ใช้ ({selectedBill.promotions.length}{" "}
                        รายการ)
                      </h3>
                      <div className="overflow-x-auto border border-gray-200 rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                Promotion Name
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                Type
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                Discount Price
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                Before VAT
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                VAT Amount
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                Ref Code
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedBill.promotions.map((promo, promoIdx) => (
                              <tr key={promoIdx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {promo.promotion_name || "-"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {promo.promotion_type || "-"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {promo.bill_discounted_price || "-"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {promo.before_vat
                                    ? `฿${promo.before_vat.toLocaleString(
                                        "th-TH",
                                      )}`
                                    : "-"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {promo.vat_amount
                                    ? `฿${promo.vat_amount.toLocaleString(
                                        "th-TH",
                                      )}`
                                    : "-"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {promo.final_pro_ref_code || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setSelectedBill(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
