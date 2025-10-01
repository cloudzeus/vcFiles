"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LicenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LicenseModal({ open, onOpenChange }: LicenseModalProps) {
  const [company, setCompany] = useState({
    name: '',
    vat: '',
    representative: '',
    address: '',
    serial: '',
    issued: '',
    vendor: '',
  });

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const res = await fetch('/api/license/company', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && data?.company) {
          setCompany(data.company);
        }
      } catch {
        // ignore, placeholders will show
      }
    };
    load();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            License Agreement – G-FILES
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm leading-relaxed text-gray-700">
          <p>
            This software <strong>G-FILES</strong> is licensed to:
          </p>

          <div className="border rounded-lg p-3 bg-gray-50 text-gray-700 space-y-1">
            <p><strong>Company:</strong> {company.name || '—'}</p>
            <p><strong>VAT:</strong> {company.vat || '—'}</p>
            <p><strong>Representative:</strong> {company.representative || '—'}</p>
            <p><strong>Address:</strong> {company.address || '—'}</p>
            <p><strong>License Serial:</strong> {company.serial || '—'}</p>
            <p><strong>Issued:</strong> {company.issued || '—'}</p>
            <p><strong>Vendor:</strong> {company.vendor || '—'}</p>
          </div>

          <p>
            By installing, accessing, or using this software, you agree to be bound by the terms
            of this License Agreement. If you do not agree, you must immediately discontinue
            use of the software.
          </p>

          <h3 className="font-semibold mt-4">Grant of License</h3>
          <p>
            G-FILES is licensed, not sold. The vendor grants you a limited, non-exclusive,
            non-transferable right to use this software for internal business purposes only,
            subject to the terms of this agreement.
          </p>

          <h3 className="font-semibold mt-4">Restrictions</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>You may not copy, modify, or distribute the software without prior written consent.</li>
            <li>You may not reverse engineer, decompile, or attempt to extract the source code.</li>
            <li>You may not sublicense, rent, or lease the software to third parties.</li>
          </ul>

          <h3 className="font-semibold mt-4">Intellectual Property</h3>
          <p>
            All rights, title, and interest in G-FILES remain the exclusive property of the vendor
            <strong> ({company.vendor})</strong>. This agreement does not grant you any rights
            to trademarks, service marks, or other intellectual property.
          </p>

          <h3 className="font-semibold mt-4">Liability Disclaimer</h3>
          <p>
            The software is provided "as is" without warranties of any kind. The vendor shall not be
            held liable for any damages, data loss, or business interruptions resulting from the
            use of this software.
          </p>

          <h3 className="font-semibold mt-4">Termination</h3>
          <p>
            This license is valid until terminated. Failure to comply with these terms will result
            in immediate termination of your rights to use the software.
          </p>

          <p className="mt-4">
            By clicking <strong>Accept</strong>, you acknowledge that you have read,
            understood, and agreed to the terms of this License Agreement.
          </p>
        </div>

        <DialogFooter className="mt-6 flex justify-center space-x-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Decline
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
