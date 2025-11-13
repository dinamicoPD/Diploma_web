/* eslint-disable @next/next/no-img-element,@typescript-eslint/no-unused-vars */

'use client';

import React from 'react';

type Format = 'letter' | 'legal';
type Mode = 'festival' | 'grado11';
type Place = 1 | 2 | 3; // 1=PRIMER, 2=SEGUNDO, 3=TERCER

export type DiplomaData = {
  mode?: Mode;
  format: Format;
  /* Encabezado */
  festivalName: string;        // fallback si no hay imagen de banner
  instituteName: string;       // bajo el banner (centrado)
  /* Cuerpo */
  studentName: string;
  reasonText: string;          // texto de por qué se otorga
  place: Place;                // 1 | 2 | 3
  date: string;
  placeLocation: string;
  rector?: string;
  teacher?: string;
  /* Imágenes */
  companyLogoUrl?: string;     // IZQ (empresa)
  festivalBannerUrl?: string;  // CENTRO (festival)
  schoolLogoUrl?: string;      // DER (colegio)
  backgroundUrl?: string;
  badgeFirstUrl?: string;      // Insignia PRIMER LUGAR
  badgeSecondUrl?: string;     // Insignia SEGUNDO LUGAR
  badgeThirdUrl?: string;      // Insignia TERCER LUGAR
};

const placeLabel = (p: Place) =>
  p === 1 ? 'PRIMER LUGAR' : p === 2 ? 'SEGUNDO LUGAR' : 'TERCER LUGAR';
const placeClass = (p: Place) => (p === 1 ? '' : p === 2 ? 'second' : 'third');

const DiplomaPreview = React.forwardRef<HTMLDivElement, DiplomaData>(
  (
    {
      mode: _mode,
      format,
      festivalName,
      instituteName,
      studentName,
      reasonText,
      place,
      date,
      placeLocation,
      rector = 'Rector (a)',
      teacher = 'Docente de área',
      companyLogoUrl,
      festivalBannerUrl,
      schoolLogoUrl,
      backgroundUrl,
      badgeFirstUrl,
      badgeSecondUrl,
      badgeThirdUrl,
    },
    ref
  ) => {
    const paperClass =
      format === 'letter' ? 'paper letter-portrait' : 'paper legal-portrait';

    const badgeUrl =
      place === 1 ? badgeFirstUrl : place === 2 ? badgeSecondUrl : badgeThirdUrl;

    return (
      <div
        ref={ref}
        className={paperClass}
        style={{
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
          backgroundColor: '#ffffff',
        }}
      >
        <div className="content">
          {/* ===== Encabezado: Empresa | Festival | Colegio ===== */}
          <div className="festival-header">
            {/* Izquierda: empresa */}
            <div className="side side--left">
              {companyLogoUrl ? <img src={companyLogoUrl} alt="Logo de la empresa" className="logo" /> : null}
            </div>

            {/* Centro: línea + banner + institución */}
            <div className="festival-center">
              <div className="line" />
              {festivalBannerUrl ? (
                <img src={festivalBannerUrl} alt="Banner del festival" className="banner" />
              ) : (
                <span className="banner-fallback">{festivalName || 'Festival'}</span>
              )}
              <div className="institute">{instituteName || 'Nombre de la institución'}</div>
            </div>

            {/* Derecha: colegio */}
            <div className="side side--right">
              {schoolLogoUrl ? <img src={schoolLogoUrl} alt="Logo del colegio" className="logo" /> : null}
            </div>
          </div>

          {/* ===== Banner de lugar ===== */}
          <div className="place-banner">
            <span className={`pill ${placeClass(place)}`}>{placeLabel(place)}</span>
          </div>

          {/* ===== Cuerpo del diploma ===== */}
          <div className="center-block body-section">
            <div className="label">a:</div>
            <div className="student">{studentName || 'Nombre del Estudiante'}</div>

            <p className="reason">
              {reasonText ||
                'Por su destacada participación y rendimiento, se otorga el presente diploma en reconocimiento a su logro.'}
            </p>

            {/* Insignia del lugar */}
            <div className="badge-wrap">
              {badgeUrl ? (
                <img src={badgeUrl} alt={placeLabel(place)} />
              ) : (
                <div style={{ fontWeight: 800 }}>{placeLabel(place)}</div>
              )}
            </div>

            {/* Firmas */}
            <div className="signatures">
              <div>
                <div className="sig-line" />
                <div className="sig-label">{rector}</div>
              </div>
              <div>
                <div className="sig-line" />
                <div className="sig-label">{teacher}</div>
              </div>
            </div>

            {/* Pie con fecha y lugar */}
            <div className="footer-note">
              Actividad realizada el día: <strong>{date || '___ de ______ de ____'}</strong> en{' '}
              <strong>{placeLocation || 'Ciudad - Departamento'}</strong>.
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DiplomaPreview.displayName = 'DiplomaPreview';
export default DiplomaPreview;
