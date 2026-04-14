import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { companyService } from '@services/company.service';
import { subscriptionService } from '@services/subscription.service';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Badge from '@components/common/Badge';
import Loader from '@components/common/Loader';
import Modal from '@components/common/Modal';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CreditCardIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '@utils/formatters';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const AdminCompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading, refetch } = useQuery(
    ['company', id],
    () => companyService.getCompanyById(id)
  );

  const { data: subscriptionHistory } = useQuery(
    ['subscription-history', id],
    () => subscriptionService.getSubscriptionHistory(id)
  );

  const cancelSubscriptionMutation = useMutation(
    (reason) => subscriptionService.cancelSubscription(id, reason),
    {
      onSuccess: () => {
        toast.success('Abonnement annulé avec succès');
        setShowCancelModal(false);
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
      }
    }
  );

  const reactivateSubscriptionMutation = useMutation(
    () => subscriptionService.reactivateSubscription(id),
    {
      onSuccess: () => {
        toast.success('Abonnement réactivé avec succès');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la réactivation');
      }
    }
  );

  const deleteCompanyMutation = useMutation(
    () => companyService.deleteCompany(id),
    {
      onSuccess: () => {
        toast.success('Entreprise supprimée avec succès');
        navigate('/admin/companies');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  );

  const company = data?.data;

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { icon: CheckCircleIcon, color: 'success', label: 'Actif' },
      SUSPENDED: { icon: XCircleIcon, color: 'danger', label: 'Suspendu' },
      EXPIRED: { icon: ClockIcon, color: 'warning', label: 'Expiré' },
      CANCELLED: { icon: XCircleIcon, color: 'gray', label: 'Annulé' },
      PENDING: { icon: ClockIcon, color: 'warning', label: 'En attente' }
    };
    const badge = badges[status] || badges.PENDING;
    return <Badge variant={badge.color}>{badge.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Entreprise non trouvée</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/admin/companies')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-sm text-gray-500">Code: {company.companyCode}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => navigate(`/admin/companies/${id}/edit`)}>
                <PencilIcon className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button variant="danger" onClick={() => deleteCompanyMutation.mutate()}>
                <TrashIcon className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Informations générales">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Nom légal</dt>
                  <dd className="font-medium">{company.legalName || company.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Numéro fiscal</dt>
                  <dd className="font-medium">{company.taxNumber || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Secteur d'activité</dt>
                  <dd className="font-medium">{company.businessSector?.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Pays</dt>
                  <dd className="font-medium">{company.country?.name || '-'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm text-gray-500">Adresse</dt>
                  <dd className="font-medium">{company.address}</dd>
                  <dd className="text-sm text-gray-500">{company.city} {company.postalCode}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Email</dt>
                  <dd className="font-medium flex items-center">
                    <EnvelopeIcon className="w-4 h-4 mr-1 text-gray-400" />
                    {company.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Téléphone</dt>
                  <dd className="font-medium flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-1 text-gray-400" />
                    {company.phoneNumber || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Site web</dt>
                  <dd className="font-medium">{company.website || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Date d'inscription</dt>
                  <dd className="font-medium flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                    {formatDate(company.registrationDate)}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card title="Dirigeant">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Nom</dt>
                  <dd className="font-medium">{company.executiveName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Poste</dt>
                  <dd className="font-medium">{company.executivePosition?.title || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Email</dt>
                  <dd className="font-medium">{company.executiveEmail}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Téléphone</dt>
                  <dd className="font-medium">{company.executivePhone || '-'}</dd>
                </div>
              </dl>
            </Card>

            <Card title="Statistiques">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <UserGroupIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{company.stats?.totalUsers || 0}</p>
                  <p className="text-sm text-gray-500">Utilisateurs totaux</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{company.stats?.activeUsers || 0}</p>
                  <p className="text-sm text-gray-500">Utilisateurs actifs</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <CreditCardIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{company.stats?.totalSubscriptions || 0}</p>
                  <p className="text-sm text-gray-500">Abonnements</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Statut">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Statut entreprise</span>
                {getStatusBadge(company.status)}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-500">Statut abonnement</span>
                <Badge variant={company.subscriptionStatus === 'ACTIVE' ? 'success' : 'warning'}>
                  {company.subscriptionStatus}
                </Badge>
              </div>
            </Card>

            <Card title="Abonnement actuel">
              {company.activeSubscription ? (
                <>
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {company.activeSubscription.plan?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {company.activeSubscription.userCount} utilisateurs
                    </p>
                  </div>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Prix par utilisateur</dt>
                      <dd className="font-medium">{formatCurrency(company.activeSubscription.pricePerUser)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Total mensuel</dt>
                      <dd className="font-medium">{formatCurrency(company.activeSubscription.totalAmount)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Prochaine facturation</dt>
                      <dd className="font-medium">{formatDate(company.activeSubscription.nextBillingDate)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Expiration</dt>
                      <dd className={clsx(
                        'font-medium',
                        company.stats?.daysUntilExpiration <= 7 ? 'text-red-600' : ''
                      )}>
                        {formatDate(company.activeSubscription.endDate)}
                        {company.stats?.daysUntilExpiration > 0 && (
                          <span className="ml-2 text-xs">
                            ({company.stats.daysUntilExpiration} jours)
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 pt-4 border-t space-y-2">
                    {company.activeSubscription.status === 'ACTIVE' && (
                      <Button
                        variant="danger"
                        fullWidth
                        onClick={() => setShowCancelModal(true)}
                      >
                        Annuler l'abonnement
                      </Button>
                    )}
                    {company.activeSubscription.status === 'CANCELLED' && (
                      <Button
                        variant="success"
                        fullWidth
                        onClick={() => reactivateSubscriptionMutation.mutate()}
                        loading={reactivateSubscriptionMutation.isLoading}
                      >
                        Réactiver l'abonnement
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => navigate(`/admin/companies/${id}/subscription/change`)}
                    >
                      Changer de plan
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">Aucun abonnement actif</p>
                  <Button onClick={() => navigate(`/admin/companies/${id}/subscription/new`)}>
                    Créer un abonnement
                  </Button>
                </div>
              )}
            </Card>

            {subscriptionHistory?.data?.length > 0 && (
              <Card title="Historique des abonnements">
                <div className="space-y-3">
                  {subscriptionHistory.data.slice(0, 5).map((sub) => (
                    <div key={sub.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{sub.plan?.name}</span>
                        <Badge variant={sub.status === 'ACTIVE' ? 'success' : 'gray'}>
                          {sub.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                      </p>
                      <p className="text-sm">{formatCurrency(sub.totalAmount)} / mois</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Annuler l'abonnement"
      >
        <div className="space-y-4">
          <p>Êtes-vous sûr de vouloir annuler l'abonnement de cette entreprise ?</p>
          <div>
            <label className="label">Raison de l'annulation (optionnel)</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input w-full"
              rows={3}
              placeholder="Raison..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => cancelSubscriptionMutation.mutate(cancelReason)}
              loading={cancelSubscriptionMutation.isLoading}
            >
              Confirmer l'annulation
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
};

export default AdminCompanyDetail;