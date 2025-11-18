'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';

import { apiClient } from '@/lib/api-client';

interface FormState {
  ownerName: string;
  shopName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  gstEnabled: boolean;
  gstNumber: string;
  languagePreference: 'en' | 'hi' | 'ka';
  subscriptionPlanId: string;
  aadharNumber: string;
  panNumber: string;
}

const initialForm: FormState = {
  ownerName: '',
  shopName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  gstEnabled: false,
  gstNumber: '',
  languagePreference: 'en',
  subscriptionPlanId: '',
  aadharNumber: '',
  panNumber: ''
};

type DocumentKey = 'aadhar' | 'pan';

const fileLabel: Record<DocumentKey, string> = {
  aadhar: 'Upload Aadhaar (PDF / Image)',
  pan: 'Upload PAN (PDF / Image)'
};

const maxFileSizeMb = 8;

interface DocumentPayload {
  fileName: string;
  contentType: string;
  data: string;
}

const SignupPage = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [documents, setDocuments] = useState<{ aadhar: File | null; pan: File | null }>({
    aadhar: null,
    pan: null
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gstNumberRequired = form.gstEnabled;

  const documentChecklist = useMemo(
    () => [
      { key: 'aadhar' as const, number: form.aadharNumber, file: documents.aadhar },
      { key: 'pan' as const, number: form.panNumber, file: documents.pan }
    ],
    [documents, form.aadharNumber, form.panNumber]
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (key: DocumentKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > maxFileSizeMb * 1024 * 1024) {
      setStatus({ type: 'error', message: `${fileLabel[key]} exceeds ${maxFileSizeMb}MB.` });
      return;
    }
    setDocuments((current) => ({ ...current, [key]: file }));
  };

  const readFileBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (gstNumberRequired && !form.gstNumber.trim()) {
      setStatus({ type: 'error', message: 'GST number is required when GST is enabled.' });
      return;
    }

    for (const { key, number, file } of documentChecklist) {
      if (!file) {
        setStatus({ type: 'error', message: `${fileLabel[key]} is required.` });
        return;
      }
      if (!number.trim()) {
        setStatus({ type: 'error', message: `Please enter the ${(key === 'aadhar' ? 'Aadhaar' : 'PAN')} number.` });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const encodedDocuments = await Promise.all(
        documentChecklist.map(async ({ key, file }) => {
          if (!file) throw new Error(`Missing ${key} document`);
          return {
            key,
            file: {
              fileName: file.name,
              contentType: file.type || 'application/octet-stream',
              data: await readFileBase64(file)
            }
          };
        })
      );

      const documentsPayload = encodedDocuments.reduce<Record<DocumentKey, DocumentPayload>>((acc, current) => {
        acc[current.key] = current.file;
        return acc;
      }, {} as Record<DocumentKey, DocumentPayload>);

      const payload = {
        ownerName: form.ownerName.trim(),
        shopName: form.shopName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        address: form.address.trim(),
        gstEnabled: form.gstEnabled,
        gstNumber: form.gstNumber.trim() || undefined,
        languagePreference: form.languagePreference,
        subscriptionPlanId: form.subscriptionPlanId.trim() || undefined,
        aadharNumber: form.aadharNumber.trim(),
        panNumber: form.panNumber.trim(),
        documents: documentsPayload
      };

      await apiClient.post<{ message?: string }>('retailers/signup', payload);

      setForm(initialForm);
      setDocuments({ aadhar: null, pan: null });
      setStatus({
        type: 'success',
        message: 'Thanks! Your application has been submitted. Our team will reach out once it is reviewed.'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit application.';
      setStatus({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-8 px-6 py-10 text-slate-900 dark:text-slate-100">
      <section className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Retailer Onboarding</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Share your business details and identity proofs. A success specialist will review and activate your account.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl surface-card p-6 shadow-xl text-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            Owner name
            <input
              name="ownerName"
              required
              value={form.ownerName}
              onChange={handleChange}
              className="surface-input rounded-lg px-3 py-3 focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="Your full name"
            />
          </label>
          <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            Store / brand name
            <input
              name="shopName"
              required
              value={form.shopName}
              onChange={handleChange}
              className="surface-input rounded-lg px-3 py-3 focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="Lakshmi Traders"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            Work email
            <input
              name="contactEmail"
              type="email"
              required
              value={form.contactEmail}
              onChange={handleChange}
              className="surface-input rounded-lg px-3 py-3 focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="you@store.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            Phone number
            <input
              name="contactPhone"
              required
              value={form.contactPhone}
              onChange={handleChange}
              className="surface-input rounded-lg px-3 py-3 focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="+91 98765 43210"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
          Store address
          <textarea
            name="address"
            required
            value={form.address}
            onChange={handleChange}
            rows={3}
            className="surface-input rounded-lg px-3 py-3 focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
            placeholder="Street, city, state, PIN"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-xl surface-muted px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
            <span>GST registered</span>
            <input
              type="checkbox"
              name="gstEnabled"
              checked={form.gstEnabled}
              onChange={handleChange}
              className="size-4 accent-[color:var(--brand-green)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            GST number
            <input
              name="gstNumber"
              value={form.gstNumber}
              onChange={handleChange}
              className="surface-input rounded-lg px-3 py-3 focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="22AAAAA0000A1Z5"
            />
          </label>
        </div>
        {gstNumberRequired ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please ensure the GST number matches your certificate. Leave it blank if you are not registered.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            Preferred language
            <select
              name="languagePreference"
              value={form.languagePreference}
              onChange={handleChange}
              className="surface-input rounded-lg px-3 py-3 focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="ka">Kannada</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            Subscription plan (optional)
            <input
              name="subscriptionPlanId"
              value={form.subscriptionPlanId}
              onChange={handleChange}
              className="surface-input rounded-lg px-3 py-3 focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="Plan ID if available"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            Aadhaar number
            <input
              name="aadharNumber"
              required
              value={form.aadharNumber}
              onChange={handleChange}
              className="surface-input rounded-lg px-3 py-3 focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="XXXX-XXXX-XXXX"
            />
          </label>
          <label className="flex flex-col gap-1 text-slate-700 dark:text-slate-200">
            PAN number
            <input
              name="panNumber"
              required
              value={form.panNumber}
              onChange={handleChange}
              className="surface-input rounded-lg px-3 py-3 focus:border-slate-400 focus:outline-none dark:focus:border-white/60"
              placeholder="ABCDE1234F"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(['aadhar', 'pan'] as DocumentKey[]).map((key) => (
            <label key={key} className="flex flex-col gap-2 text-slate-700 dark:text-slate-200">
              {fileLabel[key]}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange(key)}
                className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:border-slate-400 hover:file:bg-slate-50 dark:text-slate-300 dark:file:border-slate-600 dark:file:bg-slate-800 dark:file:text-slate-200"
              />
              {documents[key] ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">{documents[key]?.name}</span>
              ) : null}
            </label>
          ))}
        </div>

        {status ? (
          <p
            className={`text-xs ${
              status.type === 'success' ? 'text-emerald-500' : 'text-red-500 dark:text-red-300'
            }`}
          >
            {status.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="brand-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Submitting...' : 'Submit application'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-600 dark:text-slate-300">
        Already submitted?{' '}
        <Link href="/login" className="font-semibold text-[color:var(--brand-blue)] dark:text-[color:var(--brand-green)]">
          Return to login
        </Link>
      </p>
    </main>
  );
};

export default SignupPage;
