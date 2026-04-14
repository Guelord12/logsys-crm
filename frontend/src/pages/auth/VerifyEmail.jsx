import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authService } from '@services/auth.service';
import LogoSys from '@components/LogoSys';
import Loader from '@components/common/Loader';
import Alert from '@components/common/Alert';

const VerifyEmail = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setSuccess(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur de vérification');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <LogoSys size="large" asLink={false} />

        {loading ? (
          <>
            <Loader size="lg" />
            <p className="text-gray-600">Vérification de votre email...</p>
          </>
        ) : success ? (
          <Alert type="success" title="Email vérifié !">
            <p>Votre email a été vérifié avec succès.</p>
            <p className="mt-4">
              <Link to="/login" className="text-blue-600 hover:text-blue-500">
                Se connecter
              </Link>
            </p>
          </Alert>
        ) : (
          <Alert type="error" title="Erreur de vérification">
            <p>{error}</p>
            <p className="mt-4">
              <Link to="/login" className="text-blue-600 hover:text-blue-500">
                Retour à la connexion
              </Link>
            </p>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;