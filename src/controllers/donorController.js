const FoodRequest = require('../models/request');
const Donation = require('../models/donor');

const DonorController = {
  async dashboard(req, res) {
    try {
      const requests = await FoodRequest.findPending();
      const donations = await Donation.findByDonor(req.session.user.id);
      res.render('donor', {
        user: req.session.user,
        requests,
        donations,
      });
    } catch (err) {
      res.status(500).send('Error loading donor dashboard');
    }
  },

  async donate(req, res) {
    const { request_id, message } = req.body;
    try {
      await Donation.create({
        donor_id: req.session.user.id,
        request_id,
        message,
      });
      // Optionally update request status here if needed
      res.redirect('/donor');
    } catch (err) {
      res.status(500).send('Error processing donation');
    }
  }
};

module.exports = DonorController;