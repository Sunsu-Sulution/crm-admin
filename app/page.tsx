"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

type MigratedSource =
  | { source: "food_story"; data: MigratedFoodStoryMember }
  | { source: "rocket"; data: MigratedRocketMember };

interface MemberData {
  customer_ref?: string | null;
  mobile?: string | null;
  email?: string | null;
  firstname_th?: string | null;
  lastname_th?: string | null;
  firstname_en?: string | null;
  lastname_en?: string | null;
  member_status?: string | null;
  account_status?: string | null;
  last_active_at?: string | null;
  migratedSources?: MigratedSource[];
  isMigratedOnly?: boolean;
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
  birth_date?: string;
  tier_entry_date?: string;
  created_date?: string;
  updated_date?: string;
}

interface MigratedRocketMember {
  phone_no?: number;
  fullname?: string;
  current_point?: number;
  tier_name?: string;
  birthdate?: string;
  register_date?: string;
  last_login_date?: string;
  last_activity_date?: string;
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
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
  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const pageBackgroundClass =
    theme === "dark"
      ? "bg-slate-950 text-slate-100"
      : "bg-gray-50 text-gray-900";
  const panelClass =
    theme === "dark"
      ? "bg-slate-900 border border-slate-700 text-slate-100"
      : "bg-white border border-gray-200 text-gray-900";
  const subtlePanelClass =
    theme === "dark"
      ? "bg-slate-800 text-slate-100"
      : "bg-gray-50 text-gray-900";
  const inputClass =
    theme === "dark"
      ? "w-full px-4 py-2.5 border border-slate-600 rounded-md bg-slate-900 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
      : "w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const tableHeaderClass =
    theme === "dark"
      ? "bg-slate-800 text-slate-300"
      : "bg-gray-50 text-gray-500";
  const tableDividerClass =
    theme === "dark" ? "divide-slate-700" : "divide-gray-200";
  const tableRowClass =
    theme === "dark"
      ? "bg-slate-900 hover:bg-slate-800 text-slate-100"
      : "bg-white hover:bg-gray-50 text-gray-900";
  const tabButtonClass = (tabId: typeof activeTab) =>
    `px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      activeTab === tabId
        ? `border-blue-500 text-blue-500 ${
            theme === "dark" ? "bg-slate-900" : "bg-white"
          }`
        : theme === "dark"
        ? "border-transparent text-slate-300 hover:text-white hover:border-slate-600"
        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
    }`;
  const headingTextClass =
    theme === "dark" ? "text-slate-100" : "text-gray-900";
  const subheadingTextClass =
    theme === "dark" ? "text-slate-400" : "text-gray-500";
  const borderMutedClass =
    theme === "dark" ? "border-slate-700" : "border-gray-200";
  const accountStatusClass = !memberData?.account_status
    ? theme === "dark"
      ? "bg-slate-700 text-slate-100"
      : "bg-gray-100 text-gray-700"
    : memberData.account_status === "active"
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString("th-TH");
  };

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
    <div className={`min-h-screen ${pageBackgroundClass} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">CRM Member Search</h1>
            <p className="text-sm opacity-80">ค้นหาและดูข้อมูลสมาชิก CRM</p>
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              theme === "dark"
                ? "bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800"
                : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="text-xs font-semibold tracking-wide uppercase opacity-70">
              Theme
            </span>
            <div className="relative inline-flex items-center">
              <span
                className={`w-12 h-6 rounded-full transition-colors ${
                  theme === "dark" ? "bg-slate-700" : "bg-blue-200"
                }`}
              />
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center text-xs transition-transform ${
                  theme === "dark"
                    ? "translate-x-5 bg-amber-200 text-amber-700"
                    : "translate-x-0 text-blue-500"
                }`}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </span>
            </div>
          </button>
        </div>

        {/* Search Form */}
        <div className={`${panelClass} rounded-lg shadow-sm p-6 mb-6`}>
          {error && (
            <div
              className={`mb-4 p-3 rounded-md ${
                theme === "dark"
                  ? "bg-red-500/10 border border-red-500/40 text-red-200"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              <p className="text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium opacity-80 mb-2">
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
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium opacity-80 mb-2">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="text"
                  value={searchFields.mobile}
                  onChange={(e) =>
                    setSearchFields({ ...searchFields, mobile: e.target.value })
                  }
                  placeholder="กรอกเบอร์โทรศัพท์"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium opacity-80 mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={searchFields.email}
                  onChange={(e) =>
                    setSearchFields({ ...searchFields, email: e.target.value })
                  }
                  placeholder="กรอกอีเมล"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium opacity-80 mb-2">
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  value={searchFields.name}
                  onChange={(e) =>
                    setSearchFields({ ...searchFields, name: e.target.value })
                  }
                  placeholder="กรอกชื่อ-นามสกุล"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className={`px-6 py-2.5 rounded-md transition-colors font-medium ${
                  theme === "dark"
                    ? "bg-slate-800 text-slate-100 border border-slate-600 hover:bg-slate-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                ล้างข้อมูล
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {memberData && (
          <div className={`${panelClass} rounded-lg shadow-sm overflow-hidden`}>
            {/* Tabs */}
            <div
              className={`${
                theme === "dark"
                  ? "border-slate-700 bg-slate-900/70"
                  : "border-gray-200 bg-gray-50"
              } border-b`}
            >
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
                    className={tabButtonClass(
                      tab.id as
                        | "info"
                        | "bills"
                        | "coupons"
                        | "points"
                        | "tier",
                    )}
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
                  {memberData.migratedSources &&
                    memberData.migratedSources.length > 0 && (
                      <div
                        className={`border rounded-lg p-4 mb-4 ${
                          memberData.isMigratedOnly
                            ? theme === "dark"
                              ? "bg-amber-500/10 border-amber-500/40"
                              : "bg-amber-50 border-amber-200"
                            : theme === "dark"
                            ? "bg-blue-500/10 border-blue-500/40"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`font-semibold ${
                                memberData.isMigratedOnly
                                  ? theme === "dark"
                                    ? "text-amber-200"
                                    : "text-amber-700"
                                  : theme === "dark"
                                  ? "text-blue-200"
                                  : "text-blue-700"
                              }`}
                            >
                              {memberData.isMigratedOnly
                                ? "แสดงข้อมูลจาก Migration เท่านั้น"
                                : "มีข้อมูลจากระบบ Migration เพิ่มเติม"}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {memberData.migratedSources.map((source) => (
                                <span
                                  key={source.source}
                                  className={`px-2 py-1 text-xs font-medium rounded border ${
                                    theme === "dark"
                                      ? "bg-white/10 border-white/20 text-white"
                                      : "bg-white/70 border-gray-200 text-gray-700"
                                  }`}
                                >
                                  {source.source === "food_story"
                                    ? "Food Story"
                                    : "Rocket"}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p
                            className={`text-xs ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-gray-600"
                            }`}
                          >
                            {memberData.isMigratedOnly
                              ? "ไม่พบข้อมูลในระบบหลัก แสดงเฉพาะข้อมูลจากระบบที่ถูก migrate"
                              : "ข้อมูลนี้มีรายละเอียดเพิ่มเติมจากระบบที่ถูก migrate"}
                          </p>
                        </div>
                      </div>
                    )}
                  {memberCandidates.length > 1 && (
                    <div
                      className={`rounded-lg p-4 border ${
                        theme === "dark"
                          ? "border-blue-500/40 bg-blue-500/10"
                          : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              theme === "dark"
                                ? "text-blue-200"
                                : "text-blue-800"
                            }`}
                          >
                            พบผลการค้นหา {memberCandidates.length} รายการ
                          </p>
                          <p
                            className={`text-xs ${
                              theme === "dark"
                                ? "text-blue-100/80"
                                : "text-blue-700"
                            }`}
                          >
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
                              className={`text-left rounded-lg border px-4 py-3 transition-all ${
                                isActive
                                  ? theme === "dark"
                                    ? "border-blue-400 bg-slate-900 shadow-sm ring-1 ring-blue-500/40"
                                    : "border-blue-500 bg-white shadow-sm ring-1 ring-blue-300"
                                  : theme === "dark"
                                  ? "border-slate-700 bg-slate-900 hover:border-blue-400 hover:shadow-sm"
                                  : "border-transparent bg-white hover:border-blue-200 hover:shadow-sm"
                              }`}
                            >
                              <p
                                className={`text-sm font-semibold ${headingTextClass}`}
                              >
                                {displayName}
                              </p>
                              {candidate.isMigratedOnly && (
                                <p
                                  className={`text-xs font-medium ${
                                    theme === "dark"
                                      ? "text-amber-200"
                                      : "text-amber-600"
                                  }`}
                                >
                                  (ข้อมูลจาก Migration เท่านั้น)
                                </p>
                              )}
                              <p
                                className={`text-xs ${
                                  theme === "dark"
                                    ? "text-slate-300"
                                    : "text-gray-500"
                                }`}
                              >
                                Phone: {candidate.mobile || "-"}
                              </p>
                              <p
                                className={`text-xs ${
                                  theme === "dark"
                                    ? "text-slate-400"
                                    : "text-gray-400"
                                }`}
                              >
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
                      <h3
                        className={`text-lg font-semibold ${headingTextClass} mb-4`}
                      >
                        ข้อมูลพื้นฐาน
                      </h3>
                      <dl className="space-y-4">
                        <div
                          className={`border-b pb-3 ${
                            theme === "dark"
                              ? "border-slate-700"
                              : "border-gray-200"
                          }`}
                        >
                          <dt
                            className={`text-sm font-medium ${subheadingTextClass} mb-1`}
                          >
                            Customer Reference
                          </dt>
                          <dd className={`text-base ${headingTextClass}`}>
                            {memberData.customer_ref || "-"}
                          </dd>
                        </div>
                        <div
                          className={`border-b pb-3 ${
                            theme === "dark"
                              ? "border-slate-700"
                              : "border-gray-200"
                          }`}
                        >
                          <dt
                            className={`text-sm font-medium ${subheadingTextClass} mb-1`}
                          >
                            เบอร์โทรศัพท์
                          </dt>
                          <dd className={`text-base ${headingTextClass}`}>
                            {memberData.mobile || "-"}
                          </dd>
                        </div>
                        <div
                          className={`border-b pb-3 ${
                            theme === "dark"
                              ? "border-slate-700"
                              : "border-gray-200"
                          }`}
                        >
                          <dt
                            className={`text-sm font-medium ${subheadingTextClass} mb-1`}
                          >
                            อีเมล
                          </dt>
                          <dd
                            className={`text-base ${headingTextClass} break-all`}
                          >
                            {memberData.email || "-"}
                          </dd>
                        </div>
                        <div
                          className={`border-b pb-3 ${
                            theme === "dark"
                              ? "border-slate-700"
                              : "border-gray-200"
                          }`}
                        >
                          <dt
                            className={`text-sm font-medium ${subheadingTextClass} mb-1`}
                          >
                            ชื่อ-นามสกุล (ไทย)
                          </dt>
                          <dd className={`text-base ${headingTextClass}`}>
                            {memberData.firstname_th || "-"}{" "}
                            {memberData.lastname_th || ""}
                          </dd>
                        </div>
                        <div className="pb-3">
                          <dt
                            className={`text-sm font-medium ${subheadingTextClass} mb-1`}
                          >
                            ชื่อ-นามสกุล (อังกฤษ)
                          </dt>
                          <dd className={`text-base ${headingTextClass}`}>
                            {memberData.firstname_en || "-"}{" "}
                            {memberData.lastname_en || ""}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${headingTextClass} mb-4`}
                      >
                        สถานะ
                      </h3>
                      <dl className="space-y-4">
                        <div
                          className={`border-b pb-3 ${
                            theme === "dark"
                              ? "border-slate-700"
                              : "border-gray-200"
                          }`}
                        >
                          <dt
                            className={`text-sm font-medium ${subheadingTextClass} mb-2`}
                          >
                            สถานะบัญชี
                          </dt>
                          <dd className="mt-1">
                            <span
                              className={`inline-flex px-3 py-1 text-sm font-medium rounded-md ${accountStatusClass}`}
                            >
                              {memberData.account_status || "-"}
                            </span>
                          </dd>
                        </div>
                        <div className="pb-3">
                          <dt
                            className={`text-sm font-medium ${subheadingTextClass} mb-1`}
                          >
                            ใช้งานล่าสุด
                          </dt>
                          <dd className={`text-base ${headingTextClass}`}>
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
                  {memberData.migratedSources &&
                    memberData.migratedSources.length > 0 && (
                      <div
                        className={`pt-6 space-y-6 border-t ${
                          theme === "dark"
                            ? "border-slate-800"
                            : "border-gray-200"
                        }`}
                      >
                        {memberData.migratedSources
                          .filter((source) => source.source === "food_story")
                          .map((source) => {
                            const data = source.data as MigratedFoodStoryMember;
                            return (
                              <div key="migrated-food-story">
                                <h3
                                  className={`text-lg font-semibold ${headingTextClass} mb-4`}
                                >
                                  ข้อมูล Food Story เก่า
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {[
                                    {
                                      label: "ชื่อ-นามสกุล (ไทย)",
                                      value: `${data.firstname_th || "-"} ${
                                        data.lastname_th || ""
                                      }`.trim(),
                                    },
                                    {
                                      label: "ชื่อ-นามสกุล (อังกฤษ)",
                                      value: `${data.firstname_en || "-"} ${
                                        data.lastname_en || ""
                                      }`.trim(),
                                    },
                                    {
                                      label: "Phone No",
                                      value: data.phone_no || "-",
                                    },
                                    {
                                      label: "วันเกิด",
                                      value: formatDate(data.birth_date),
                                    },
                                    {
                                      label: "Tier Entry Date",
                                      value: formatDate(data.tier_entry_date),
                                    },
                                    {
                                      label: "Current Point",
                                      value: data.current_point
                                        ? data.current_point.toLocaleString(
                                            "th-TH",
                                          )
                                        : "-",
                                      emphasize: true,
                                      emphasizeColor: "text-blue-600",
                                    },
                                    {
                                      label: "Tier ID",
                                      value: data.tier_id || "-",
                                    },
                                    {
                                      label: "Tier Name",
                                      value: data.tier_name || "-",
                                      badge: true,
                                      badgeColor: "blue",
                                    },
                                    {
                                      label: "Created Date",
                                      value: formatDate(data.created_date),
                                    },
                                    {
                                      label: "Updated Date",
                                      value: formatDate(data.updated_date),
                                    },
                                  ].map((item, idx) => (
                                    <div
                                      key={idx}
                                      className={`${subtlePanelClass} p-4 rounded-lg border ${
                                        theme === "dark"
                                          ? "border-slate-700/70"
                                          : "border-gray-200"
                                      }`}
                                    >
                                      <dt
                                        className={`text-xs font-medium ${subheadingTextClass} mb-1`}
                                      >
                                        {item.label}
                                      </dt>
                                      <dd
                                        className={`text-base font-semibold ${
                                          item.emphasize
                                            ? item.emphasizeColor ||
                                              (theme === "dark"
                                                ? "text-blue-300"
                                                : "text-blue-600")
                                            : headingTextClass
                                        }`}
                                      >
                                        {item.badge && item.value !== "-" ? (
                                          <span
                                            className={`px-2 py-1 text-sm font-medium rounded ${
                                              item.badgeColor === "purple"
                                                ? theme === "dark"
                                                  ? "bg-purple-500/20 text-purple-100"
                                                  : "bg-purple-100 text-purple-800"
                                                : theme === "dark"
                                                ? "bg-blue-500/20 text-blue-100"
                                                : "bg-blue-100 text-blue-800"
                                            }`}
                                          >
                                            {item.value}
                                          </span>
                                        ) : (
                                          item.value
                                        )}
                                      </dd>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}

                        {memberData.migratedSources
                          .filter((source) => source.source === "rocket")
                          .map((source) => {
                            const data = source.data as MigratedRocketMember;
                            return (
                              <div key="migrated-rocket">
                                <h3
                                  className={`text-lg font-semibold ${headingTextClass} mb-4`}
                                >
                                  ข้อมูล Rocket เก่า
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {[
                                    {
                                      label: "ชื่อ-นามสกุล",
                                      value: data.fullname || "-",
                                    },
                                    {
                                      label: "Phone No",
                                      value: data.phone_no || "-",
                                    },
                                    {
                                      label: "วันเกิด",
                                      value: formatDate(data.birthdate),
                                    },
                                    {
                                      label: "Register Date",
                                      value: formatDate(data.register_date),
                                    },
                                    {
                                      label: "Last Login",
                                      value: formatDate(data.last_login_date),
                                    },
                                    {
                                      label: "Last Activity",
                                      value: formatDate(
                                        data.last_activity_date,
                                      ),
                                    },
                                    {
                                      label: "Current Point",
                                      value: data.current_point
                                        ? data.current_point.toLocaleString(
                                            "th-TH",
                                          )
                                        : "-",
                                      emphasize: true,
                                      emphasizeColor: "text-purple-600",
                                    },
                                    {
                                      label: "Tier Name",
                                      value: data.tier_name || "-",
                                      badge: true,
                                      badgeColor: "purple",
                                    },
                                  ].map((item, idx) => (
                                    <div
                                      key={idx}
                                      className={`${subtlePanelClass} p-4 rounded-lg border ${
                                        theme === "dark"
                                          ? "border-slate-700/70"
                                          : "border-gray-200"
                                      }`}
                                    >
                                      <dt
                                        className={`text-xs font-medium ${subheadingTextClass} mb-1`}
                                      >
                                        {item.label}
                                      </dt>
                                      <dd
                                        className={`text-base font-semibold ${
                                          item.emphasize
                                            ? item.emphasizeColor ||
                                              (theme === "dark"
                                                ? "text-purple-300"
                                                : "text-purple-600")
                                            : headingTextClass
                                        }`}
                                      >
                                        {item.badge && item.value !== "-" ? (
                                          <span
                                            className={`px-2 py-1 text-sm font-medium rounded ${
                                              item.badgeColor === "purple"
                                                ? theme === "dark"
                                                  ? "bg-purple-500/20 text-purple-100"
                                                  : "bg-purple-100 text-purple-800"
                                                : theme === "dark"
                                                ? "bg-blue-500/20 text-blue-100"
                                                : "bg-blue-100 text-blue-800"
                                            }`}
                                          >
                                            {item.value}
                                          </span>
                                        ) : (
                                          item.value
                                        )}
                                      </dd>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                </div>
              )}

              {/* Bills Tab */}
              {activeTab === "bills" && (
                <div>
                  <h3
                    className={`text-lg font-semibold ${headingTextClass} mb-4`}
                  >
                    รายการบิล
                  </h3>

                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          className={`block text-sm font-medium ${subheadingTextClass} mb-1`}
                        >
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
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium ${subheadingTextClass} mb-1`}
                        >
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
                          className={inputClass}
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
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                          theme === "dark"
                            ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                        disabled={!hasBillDateFilter}
                      >
                        ล้างตัวกรอง
                      </button>
                    </div>
                  </div>

                  {hasBillResults ? (
                    <div
                      className={`overflow-x-auto border rounded-md ${
                        theme === "dark"
                          ? "border-slate-700"
                          : "border-gray-200"
                      }`}
                    >
                      <table
                        className={`min-w-full divide-y ${tableDividerClass}`}
                      >
                        <thead className={tableHeaderClass}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Payment Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Receipt No
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Store
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Payment Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Net Paid
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Promotions
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${tableDividerClass}`}>
                          {displayedBills.map((bill, idx) => {
                            const billId = bill.payment_id || idx;
                            const isExpanded = expandedBills.has(billId);
                            const hasPromotions =
                              bill.promotions && bill.promotions.length > 0;

                            return (
                              <Fragment key={billId}>
                                <tr
                                  className={`${tableRowClass} cursor-pointer transition-colors`}
                                  onClick={() => setSelectedBill(bill)}
                                >
                                  <td
                                    className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                                  >
                                    {bill.payment_date || "-"}
                                  </td>
                                  <td
                                    className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                                  >
                                    {bill.receipt_no || "-"}
                                  </td>
                                  <td
                                    className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                                  >
                                    {bill.store_name || "-"}
                                  </td>
                                  <td
                                    className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                                  >
                                    {bill.payment_type || "-"}
                                  </td>
                                  <td
                                    className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${headingTextClass}`}
                                  >
                                    {bill.net_paid
                                      ? `฿${bill.net_paid.toLocaleString(
                                          "th-TH",
                                        )}`
                                      : "-"}
                                  </td>
                                  <td
                                    className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                                  >
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
                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                                          theme === "dark"
                                            ? "border-blue-500/40 bg-blue-500/10 text-blue-100 hover:border-blue-400 hover:bg-blue-500/20"
                                            : "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100"
                                        }`}
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
                                      <span
                                        className={
                                          theme === "dark"
                                            ? "text-slate-500"
                                            : "text-gray-400"
                                        }
                                      >
                                        -
                                      </span>
                                    )}
                                  </td>
                                </tr>
                                {isExpanded && hasPromotions && (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className={`px-6 py-4 ${
                                        theme === "dark"
                                          ? "bg-slate-900/60 border-t border-slate-700"
                                          : "bg-slate-50 border-t border-slate-200"
                                      }`}
                                    >
                                      <div
                                        className={`rounded-lg border shadow-sm p-4 ${
                                          theme === "dark"
                                            ? "border-slate-700 bg-slate-900"
                                            : "border-slate-200 bg-white"
                                        }`}
                                      >
                                        <h4
                                          className={`text-sm font-semibold ${
                                            theme === "dark"
                                              ? "text-slate-200"
                                              : "text-slate-700"
                                          } mb-2`}
                                        >
                                          Promotion ที่ใช้ในบิลนี้:
                                        </h4>
                                        <div className="overflow-x-auto">
                                          <table
                                            className={`min-w-full divide-y ${tableDividerClass}`}
                                          >
                                            <thead className={tableHeaderClass}>
                                              <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium">
                                                  Promotion Name
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium">
                                                  Type
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium">
                                                  Discount Price
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium">
                                                  Before VAT
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium">
                                                  VAT Amount
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium">
                                                  Ref Code
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody
                                              className={`divide-y ${tableDividerClass}`}
                                            >
                                              {bill.promotions?.map(
                                                (promo, promoIdx) => (
                                                  <tr
                                                    key={promoIdx}
                                                    className={`${tableRowClass}`}
                                                  >
                                                    <td
                                                      className={`px-4 py-2 text-sm ${headingTextClass}`}
                                                    >
                                                      {promo.promotion_name ||
                                                        "-"}
                                                    </td>
                                                    <td
                                                      className={`px-4 py-2 text-sm ${headingTextClass}`}
                                                    >
                                                      {promo.promotion_type ||
                                                        "-"}
                                                    </td>
                                                    <td
                                                      className={`px-4 py-2 text-sm ${headingTextClass}`}
                                                    >
                                                      {promo.bill_discounted_price ||
                                                        "-"}
                                                    </td>
                                                    <td
                                                      className={`px-4 py-2 text-sm ${headingTextClass}`}
                                                    >
                                                      {promo.before_vat
                                                        ? `฿${promo.before_vat.toLocaleString(
                                                            "th-TH",
                                                          )}`
                                                        : "-"}
                                                    </td>
                                                    <td
                                                      className={`px-4 py-2 text-sm ${headingTextClass}`}
                                                    >
                                                      {promo.vat_amount
                                                        ? `฿${promo.vat_amount.toLocaleString(
                                                            "th-TH",
                                                          )}`
                                                        : "-"}
                                                    </td>
                                                    <td
                                                      className={`px-4 py-2 text-sm ${headingTextClass}`}
                                                    >
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
                    <div
                      className={`text-center py-12 border rounded-md ${
                        theme === "dark"
                          ? "border-slate-800 bg-slate-900/60"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <p
                        className={
                          theme === "dark" ? "text-slate-300" : "text-gray-500"
                        }
                      >
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
                  <h3
                    className={`text-lg font-semibold ${headingTextClass} mb-4`}
                  >
                    คูปอง
                  </h3>
                  {coupons.length > 0 ? (
                    <div
                      className={`overflow-x-auto border rounded-md ${
                        theme === "dark"
                          ? "border-slate-700"
                          : "border-gray-200"
                      }`}
                    >
                      <table
                        className={`min-w-full divide-y ${tableDividerClass}`}
                      >
                        <thead className={tableHeaderClass}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Coupon Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Campaign
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Expired At
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Used At
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${tableDividerClass}`}>
                          {coupons.map((coupon, idx) => (
                            <tr key={idx} className={tableRowClass}>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${headingTextClass}`}
                              >
                                {coupon.coupon_code || "-"}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
                                {coupon.coupon_type || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${
                                    coupon.coupon_status === "used"
                                      ? theme === "dark"
                                        ? "bg-green-500/20 text-green-100"
                                        : "bg-green-100 text-green-800"
                                      : coupon.coupon_status === "expired"
                                      ? theme === "dark"
                                        ? "bg-red-500/20 text-red-100"
                                        : "bg-red-100 text-red-800"
                                      : theme === "dark"
                                      ? "bg-yellow-500/20 text-yellow-100"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {coupon.coupon_status || "-"}
                                </span>
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
                                {coupon.campaign || "-"}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
                                {coupon.expired_at
                                  ? new Date(
                                      coupon.expired_at,
                                    ).toLocaleDateString("th-TH")
                                  : "-"}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
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
                    <div
                      className={`text-center py-12 border rounded-md ${
                        theme === "dark"
                          ? "border-slate-800 bg-slate-900/60"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <p
                        className={
                          theme === "dark" ? "text-slate-300" : "text-gray-500"
                        }
                      >
                        ไม่มีข้อมูลคูปอง
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Points Tab */}
              {activeTab === "points" && (
                <div>
                  <h3
                    className={`text-lg font-semibold ${headingTextClass} mb-4`}
                  >
                    คะแนน
                  </h3>
                  {points.length > 0 ? (
                    <div
                      className={`overflow-x-auto border rounded-md ${
                        theme === "dark"
                          ? "border-slate-700"
                          : "border-gray-200"
                      }`}
                    >
                      <table
                        className={`min-w-full divide-y ${tableDividerClass}`}
                      >
                        <thead className={tableHeaderClass}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Point Balance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Currency
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Point Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Expired Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${tableDividerClass}`}>
                          {points.map((point, idx) => (
                            <tr key={idx} className={tableRowClass}>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${headingTextClass}`}
                              >
                                {point.point_balance
                                  ? point.point_balance.toLocaleString("th-TH")
                                  : "-"}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
                                {point.point_currency || "-"}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
                                {point.point_type || "-"}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
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
                    <div
                      className={`text-center py-12 border rounded-md ${
                        theme === "dark"
                          ? "border-slate-800 bg-slate-900/60"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <p
                        className={
                          theme === "dark" ? "text-slate-300" : "text-gray-500"
                        }
                      >
                        ไม่มีข้อมูลคะแนน
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tier Movement Tab */}
              {activeTab === "tier" && (
                <div>
                  <h3
                    className={`text-lg font-semibold ${headingTextClass} mb-4`}
                  >
                    Tier Movement
                  </h3>
                  {tierMovements.length > 0 ? (
                    <div
                      className={`overflow-x-auto border rounded-md ${
                        theme === "dark"
                          ? "border-slate-700"
                          : "border-gray-200"
                      }`}
                    >
                      <table
                        className={`min-w-full divide-y ${tableDividerClass}`}
                      >
                        <thead className={tableHeaderClass}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Entry Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Loyalty Program
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Tier Group
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Current Tier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Previous Tier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Expired Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Next Tier
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${tableDividerClass}`}>
                          {tierMovements.map((tier, idx) => (
                            <tr key={idx} className={tableRowClass}>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
                                {tier.entry_date
                                  ? new Date(
                                      tier.entry_date,
                                    ).toLocaleDateString("th-TH")
                                  : "-"}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
                                {tier.loyalty_program_name || "-"}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
                                {tier.tier_group_name || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded ${
                                    theme === "dark"
                                      ? "bg-blue-500/20 text-blue-100"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {tier.tier_name || "-"}
                                </span>
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
                                {tier.previous_tier_name || "-"}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
                                {tier.expired_date
                                  ? new Date(
                                      tier.expired_date,
                                    ).toLocaleDateString("th-TH")
                                  : "-"}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${headingTextClass}`}
                              >
                                {tier.promotion_next_tier_name || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div
                      className={`text-center py-12 border rounded-md ${
                        theme === "dark"
                          ? "border-slate-800 bg-slate-900/60"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <p
                        className={
                          theme === "dark" ? "text-slate-300" : "text-gray-500"
                        }
                      >
                        ไม่มีข้อมูล Tier Movement
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!memberData && !loading && (
          <div
            className={`${panelClass} rounded-lg shadow-sm p-12 text-center`}
          >
            <p
              className={`text-lg ${
                theme === "dark" ? "text-slate-300" : "text-gray-500"
              }`}
            >
              กรุณากรอกข้อมูลที่ต้องการค้นหาเพื่อดูข้อมูลสมาชิก CRM
            </p>
          </div>
        )}

        {/* Bill Detail Modal */}
        {selectedBill && (
          <div
            className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
              theme === "dark" ? "bg-black/70" : "bg-black/40"
            }`}
            onClick={() => setSelectedBill(null)}
          >
            <div
              className={`${panelClass} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`sticky top-0 px-6 py-4 flex justify-between items-center border-b ${
                  theme === "dark"
                    ? "bg-slate-900 border-slate-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <h2 className={`text-xl font-bold ${headingTextClass}`}>
                  รายละเอียดบิล
                </h2>
                <button
                  onClick={() => setSelectedBill(null)}
                  className={`text-2xl ${
                    theme === "dark"
                      ? "text-slate-400 hover:text-white"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3
                      className={`text-lg font-semibold ${headingTextClass} mb-4`}
                    >
                      ข้อมูลบิล
                    </h3>
                    <dl className="space-y-3">
                      <div className={`border-b ${borderMutedClass} pb-2`}>
                        <dt
                          className={`text-sm font-medium ${subheadingTextClass} mb-1`}
                        >
                          Payment ID
                        </dt>
                        <dd className={`text-base ${headingTextClass}`}>
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
