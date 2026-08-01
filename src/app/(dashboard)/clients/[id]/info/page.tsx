"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Building2, Loader2, CheckCircle } from "lucide-react";

interface ClientInfoData {
  company_name_he?: string;
  company_name_en?: string;
  official_email?: string;
  official_website?: string;
  official_phone?: string;
  official_address?: string;
  official_contact_name?: string;
  company_description?: string;
  [key: string]: any; // Allow flexible dynamic fields
}

export default function ClientInfoPage({ params }: { params: Promise<{ id: string }> }) {
  const clientId = React.use(params).id;

  const [info, setInfo] = useState<ClientInfoData>({
    company_name_he: "",
    company_name_en: "",
    official_email: "",
    official_website: "",
    official_phone: "",
    official_address: "",
    official_contact_name: "",
    company_description: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function fetchClientInfo() {
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("official_info")
          .eq("id", clientId)
          .single();

        if (error) {
          console.error("Error fetching client info:", error);
        } else if (data) {
          const storedInfo = data.official_info || {};
          setInfo({
            company_name_he: storedInfo.company_name_he ?? "",
            company_name_en: storedInfo.company_name_en ?? "",
            official_email: storedInfo.official_email ?? "",
            official_website: storedInfo.official_website ?? "",
            official_phone: storedInfo.official_phone ?? "",
            official_address: storedInfo.official_address ?? "",
            official_contact_name: storedInfo.official_contact_name ?? "",
            company_description: storedInfo.company_description ?? "",
            ...storedInfo, // keep any additional custom JSON keys
          });
        }
      } catch (err) {
        console.error("Fetch exception:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchClientInfo();
  }, [clientId]);

  const handleChange = (field: keyof ClientInfoData, value: string) => {
    setInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const { error } = await supabase
        .from("clients")
        .update({ official_info: info })
        .eq("id", clientId);

      if (error) {
        console.error("Save error:", error);
        toast.error(`Failed to save client info: ${error.message}`);
      } else {
        toast.success("Official Client Info saved successfully!");
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading client official information...
      </div>
    );
  }

  const FORM_FIELDS: Array<{
    key: keyof ClientInfoData;
    labelHe: string;
    labelEn: string;
    id: string;
    dataName: string;
    type?: string;
    placeholder?: string;
    direction?: "rtl" | "ltr";
  }> = [
    {
      key: "company_name_he",
      labelHe: "שם חברה בעברית",
      labelEn: "Company Name (Hebrew)",
      id: "company-name-he",
      dataName: "company-name-he",
      direction: "rtl",
      placeholder: "הכנס שם חברה בעברית",
    },
    {
      key: "company_name_en",
      labelHe: "שם חברה באנגלית",
      labelEn: "Company Name (English)",
      id: "company-name-en",
      dataName: "company-name-en",
      direction: "ltr",
      placeholder: "Enter English Company Name",
    },
    {
      key: "official_email",
      labelHe: "דואר אלקטרוני",
      labelEn: "Official Email",
      id: "official-email",
      dataName: "official-email",
      type: "email",
      direction: "ltr",
      placeholder: "info@company.com",
    },
    {
      key: "official_website",
      labelHe: "כתובת אתר אינטרנט",
      labelEn: "Official Website",
      id: "official-website",
      dataName: "official-website",
      type: "url",
      direction: "ltr",
      placeholder: "https://www.company.com",
    },
    {
      key: "official_phone",
      labelHe: "מספר טלפון",
      labelEn: "Official Phone",
      id: "official-phone",
      dataName: "official-phone",
      type: "tel",
      direction: "ltr",
      placeholder: "03-1234567 / 050-1234567",
    },
    {
      key: "official_address",
      labelHe: "כתובת החברה",
      labelEn: "Company Address",
      id: "official-address",
      dataName: "official-address",
      direction: "rtl",
      placeholder: "רחוב, מספר, עיר, מיקוד",
    },
    {
      key: "official_contact_name",
      labelHe: "שם איש קשר",
      labelEn: "Contact Person Name",
      id: "official-contact-name",
      dataName: "official-contact-name",
      direction: "rtl",
      placeholder: "שם מלא של איש הקשר הרשמי",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Official Client Info / מידע רשמי של הלקוח</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Official company details used for directory submission & index listing.
              </p>
            </div>
          </div>

          <Button
            id="btn-save-client-info"
            data-name="save-client-info"
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-300" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Official Info
              </>
            )}
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Structured Table for Primary Fields */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-1/3 border-r border-gray-200">Field Name / שם השדה</th>
                  <th className="px-4 py-3 w-2/3">Official Value / ערך רשמי</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {FORM_FIELDS.map((field) => (
                  <tr
                    key={field.id}
                    id={`row-${field.id}`}
                    data-name={field.dataName}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-4 py-3 border-r border-gray-200 font-medium text-gray-700 bg-gray-50/30">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900" dir="rtl">{field.labelHe}</span>
                        <span className="text-xs text-gray-400">{field.labelEn}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        id={`input-${field.id}`}
                        data-name={field.dataName}
                        type={field.type || "text"}
                        value={info[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        dir={field.direction}
                        className="bg-white border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Separate Long Textarea Field for Company Description */}
          <div
            id="row-company-description"
            data-name="company-description"
            className="border border-gray-200 rounded-lg p-5 bg-white space-y-2 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <label
                htmlFor="input-company-description"
                className="font-bold text-sm text-gray-900 flex items-center gap-2"
              >
                <span>תאור החברה (Company Description)</span>
              </label>
              <span className="text-xs text-gray-400">Long text format for index submissions</span>
            </div>
            <Textarea
              id="input-company-description"
              data-name="company-description"
              value={info.company_description || ""}
              onChange={(e) => handleChange("company_description", e.target.value)}
              placeholder="הכנס תאור מפורט של החברה המתאים להגשה לאינדקס אתרים..."
              rows={6}
              dir="rtl"
              className="bg-white border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button
              id="btn-save-client-info-bottom"
              data-name="save-client-info"
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 px-6"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Official Info
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
