use x509_parser::prelude::*;
use x509_parser::extensions::ParsedExtension;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone)]
pub struct ParsedCertificate {
    pub subject: String,
    pub issuer: String,
    pub expiration: DateTime<Utc>,
    pub san_entries: Vec<String>,
}

pub fn parse_pem_certificate(pem_str: &str) -> Result<ParsedCertificate, String> {
    // Parse the PEM container using the robust `pem` crate which handles whitespace issues better
    let pem = ::pem::parse(pem_str)
        .map_err(|e| format!("Failed to parse PEM container: {}", e))?;
    
    if pem.tag() != "CERTIFICATE" {
        return Err("Provided PEM is not a CERTIFICATE".to_string());
    }

    // Parse the DER certificate
    let (_, cert) = parse_x509_certificate(pem.contents())
        .map_err(|e| format!("Failed to parse X.509 certificate: {}", e))?;

    // Extract Subject Common Name (CN)
    let subject = extract_common_name(cert.subject())
        .unwrap_or_else(|| cert.subject().to_string());

    // Extract Issuer Common Name (CN)
    let issuer = extract_common_name(cert.issuer())
        .unwrap_or_else(|| cert.issuer().to_string());

    // Extract Expiration (Not After)
    let not_after_ts = cert.validity().not_after.timestamp();
    let expiration = DateTime::<Utc>::from_timestamp(not_after_ts, 0)
        .ok_or_else(|| "Invalid expiration timestamp in certificate".to_string())?;

    // Extract Subject Alternative Names (SANs)
    let mut san_entries = Vec::new();
    for ext in cert.extensions() {
        if let ParsedExtension::SubjectAlternativeName(san) = ext.parsed_extension() {
            for name in &san.general_names {
                match name {
                    x509_parser::extensions::GeneralName::DNSName(dns) => san_entries.push(dns.to_string()),
                    x509_parser::extensions::GeneralName::IPAddress(ip) => {
                        if ip.len() == 4 {
                            san_entries.push(format!("{}.{}.{}.{}", ip[0], ip[1], ip[2], ip[3]));
                        } else {
                            san_entries.push(format!("{:?}", ip));
                        }
                    }
                    x509_parser::extensions::GeneralName::RFC822Name(email) => san_entries.push(email.to_string()),
                    x509_parser::extensions::GeneralName::URI(uri) => san_entries.push(uri.to_string()),
                    _ => {}
                }
            }
        }
    }

    Ok(ParsedCertificate {
        subject,
        issuer,
        expiration,
        san_entries,
    })
}

fn extract_common_name(name: &X509Name) -> Option<String> {
    name.iter_common_name()
        .next()
        .and_then(|attr| attr.as_str().ok().map(|s| s.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use rcgen::{CertificateParams, DnType};

    #[test]
    fn test_parse_valid_certificate() {
        // Generate a self-signed certificate using rcgen for testing
        let subject_alt_names = vec!["localhost".to_string(), "127.0.0.1".to_string()];
        let mut params = CertificateParams::new(subject_alt_names.clone());
        params.distinguished_name.push(DnType::CommonName, "Test Service");
        
        let cert = rcgen::Certificate::from_params(params).unwrap();
        let pem_str = cert.serialize_pem().unwrap();
        let pem_str_crlf = pem_str.replace("\n", "\r\n");

        let parsed = parse_pem_certificate(&pem_str_crlf).unwrap();

        assert_eq!(parsed.subject, "Test Service");
        assert_eq!(parsed.issuer, "Test Service"); // Self-signed so issuer == subject
        assert!(parsed.san_entries.contains(&"localhost".to_string()));
        assert!(parsed.san_entries.contains(&"127.0.0.1".to_string()));
        assert!(parsed.expiration > Utc::now());
    }

    #[test]
    fn test_parse_invalid_pem() {
        let invalid_pem = "-----BEGIN CERTIFICATE-----\nInvalidContent\n-----END CERTIFICATE-----";
        let result = parse_pem_certificate(invalid_pem);
        assert!(result.is_err());
    }
}
