const FoodRequest = require('../models/request');
const Donation = require('../models/donor');

const ReceiverController = {
  async dashboard(req, res) {
    try {
      const requests = await FoodRequest.findByReceiver(req.session.user.id);
      res.render('receiver', {
        user: req.session.user,
        requests,
      });
    } catch (err) {
      res.status(500).send('Error loading receiver dashboard');
    }
  },

  async requestFood(req, res) {
    const { food_type, quantity, location, description } = req.body;
    try {
      await FoodRequest.create({
        receiver_id: req.session.user.id,
        food_type,
        quantity,
        location,
        description,
      });
      res.redirect('/receiver');
    } catch (err) {
      res.status(500).send('Error submitting food request');
    }
  },

  async confirmDonation(req, res) {
    const { donation_id, request_id } = req.body;
    try {
      await Donation.updateStatus(donation_id, 'fulfilled');
      await FoodRequest.updateStatus(request_id, 'fulfilled');
      res.redirect('/receiver');
    } catch (err) {
      res.status(500).send('Error confirming donation');
    }
  }
};

module.exports = ReceiverController;