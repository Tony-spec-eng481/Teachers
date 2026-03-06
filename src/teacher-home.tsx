import React from "react";
import { Link } from "react-router-dom";
import { Footer } from './shared';
import  "./shared/styles/pages/TeacherHome.css";

const TeacherHome = () => {
  return (
    <>
      {/* Teacher-specific Navbar */}
      <nav className="teacher-navbar">
        <div className="teacher-navbar-container">
          <Link to="/" className="teacher-logo">
            Trespics &nbsp; Teachers
          </Link>
          <div className="teacher-nav-links">
            <Link
              to="https://library.trespicsinstitute.dev/"
              className="teacher-nav-link"
            >
              <span className="nav-link-icon">Library</span>
            </Link>
            <Link
              to="https://www.trespicsinstitute.dev/"
              className="teacher-nav-link"
            >
              <span className="nav-link-icon">🏠</span>
              Back to Student's Site
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="teacher-hero">
        <div className="teacher-hero-overlay"></div>
        <div className="container teacher-hero-content">
          <span className="teacher-hero-badge">
            Join Our Teaching Community
          </span>
          <h1 className="teacher-hero-title">
            Empower the <span className="text-gradient">Next Generation</span>
          </h1>
          <p className="teacher-hero-subtitle">
            Join our community of expert educators. Share your knowledge, create
            engaging courses, and inspire students worldwide.
          </p>

          <div className="teacher-hero-buttons">
            <Link to="/auth/login" className="btn btn-primary btn-lg">
              Teacher Login
              <span className="btn-icon">→</span>
            </Link>
            <Link to="/auth/register" className="btn btn-outline-light btn-lg">
              Register as Teacher
            </Link>
          </div>
        </div>

        <div className="teacher-hero-wave">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path
              fill="#ffffff"
              fillOpacity="1"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,170.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="teacher-features">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Why Teach With Us</span>
            <h2 className="section-title">Everything You Need to Succeed</h2>
            <p className="section-subtitle">
              Powerful tools and features designed specifically for educators
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon create-icon">📝</div>
              <h3>Create Courses</h3>
              <p>
                Easily upload videos, notes, assignments, and quizzes. Build
                comprehensive courses with our intuitive course builder.
              </p>
              <ul className="feature-list">
                <li>✓ Video lessons</li>
                <li>✓ PDF resources</li>
                <li>✓ Interactive quizzes</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon live-icon">🎥</div>
              <h3>Go Live</h3>
              <p>
                Host interactive live classes with real-time student
                participation. Engage with polls, chat, and screen sharing.
              </p>
              <ul className="feature-list">
                <li>✓ HD video streaming</li>
                <li>✓ Real-time chat</li>
                <li>✓ Session recording</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon track-icon">📊</div>
              <h3>Track Progress</h3>
              <p>
                Monitor student performance, engagement, and completion rates
                with detailed analytics and reports.
              </p>
              <ul className="feature-list">
                <li>✓ Performance analytics</li>
                <li>✓ Attendance tracking</li>
                <li>✓ Grade management</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon community-icon">👥</div>
              <h3>Community Building</h3>
              <p>
                Create discussion forums, group projects, and peer learning
                opportunities for your students.
              </p>
              <ul className="feature-list">
                <li>✓ Discussion boards</li>
                <li>✓ Group projects</li>
                <li>✓ Peer reviews</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon earnings-icon">💰</div>
              <h3>Competitive Earnings</h3>
              <p>
                Earn competitive compensation for your expertise. Get paid
                monthly with transparent revenue sharing.
              </p>
              <ul className="feature-list">
                <li>✓ Monthly payouts</li>
                <li>✓ Revenue sharing</li>
                <li>✓ Bonus incentives</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon support-icon">🛠️</div>
              <h3>Dedicated Support</h3>
              <p>
                Get priority technical support and teaching assistance whenever
                you need it.
              </p>
              <ul className="feature-list">
                <li>✓ 24/7 tech support</li>
                <li>✓ Teaching resources</li>
                <li>✓ Professional development</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Simple Process</span>
            <h2 className="section-title">How to Get Started</h2>
            <p className="section-subtitle">
              Join our teaching community in four easy steps
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">📝</div>
              <h3>Register</h3>
              <p>
                Create your teacher account with basic information and
                credentials
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">✅</div>
              <h3>Get Verified</h3>
              <p>Submit your qualifications and experience for verification</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🎓</div>
              <h3>Create Content</h3>
              <p>Build your first course or schedule your first live class</p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon">🚀</div>
              <h3>Start Teaching</h3>
              <p>Begin teaching and inspiring students worldwide</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <div className="benefits-grid">
            <div className="benefits-content">
              <span className="section-badge">Teacher Benefits</span>
              <h2 className="benefits-title">Why Teachers Love Trespics</h2>

              <div className="benefits-list">
                <div className="benefit-item">
                  <div className="benefit-icon">⭐</div>
                  <div>
                    <h4>Flexible Schedule</h4>
                    <p>Teach on your own time, from anywhere in the world</p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">📈</div>
                  <div>
                    <h4>Growth Opportunities</h4>
                    <p>
                      Access professional development and career advancement
                    </p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">🌍</div>
                  <div>
                    <h4>Global Reach</h4>
                    <p>
                      Connect with students from different countries and
                      cultures
                    </p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">🤝</div>
                  <div>
                    <h4>Supportive Community</h4>
                    <p>
                      Join a network of passionate educators sharing best
                      practices
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="benefits-image">
              <img src="/api/placeholder/600/500" alt="Teacher teaching" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="teacher-testimonials">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Teacher Stories</span>
            <h2 className="section-title">What Our Teachers Say</h2>
            <p className="section-subtitle">
              Hear from educators who are making a difference
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">★★★★★</div>
              <p className="testimonial-text">
                "Trespics has transformed how I teach. The platform is
                intuitive, and I can reach students from all over the world. The
                support team is amazing!"
              </p>
              <div className="testimonial-author">
                <img
                  src="/api/placeholder/60/60"
                  alt="Teacher"
                  className="author-avatar"
                />
                <div>
                  <h4>Dr. Sarah Johnson</h4>
                  <p>Mathematics Teacher, 5 years</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-rating">★★★★★</div>
              <p className="testimonial-text">
                "I love the flexibility it offers. I can create my own
                curriculum and teach at my own pace. The earnings are great
                too!"
              </p>
              <div className="testimonial-author">
                <img
                  src="/api/placeholder/60/60"
                  alt="Teacher"
                  className="author-avatar"
                />
                <div>
                  <h4>Prof. Michael Chen</h4>
                  <p>Physics Teacher, 3 years</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-rating">★★★★★</div>
              <p className="testimonial-text">
                "The live class feature is fantastic. I can interact with
                students in real-time and the recording feature helps those who
                miss class."
              </p>
              <div className="testimonial-author">
                <img
                  src="/api/placeholder/60/60"
                  alt="Teacher"
                  className="author-avatar"
                />
                <div>
                  <h4>Emily Rodriguez</h4>
                  <p>English Teacher, 2 years</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="teacher-faq">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">FAQ</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Everything you need to know about teaching with Trespics
            </p>
          </div>

          <div className="faq-grid">
            <div className="faq-item">
              <h4>What qualifications do I need?</h4>
              <p>
                We require a bachelor's degree in your subject area and teaching
                experience. Additional certifications are a plus.
              </p>
            </div>

            <div className="faq-item">
              <h4>How much can I earn?</h4>
              <p>
                Earnings vary based on courses and student enrollment. Top
                teachers earn $5000+ monthly.
              </p>
            </div>

            <div className="faq-item">
              <h4>Can I teach part-time?</h4>
              <p>
                Yes! Many of our teachers teach part-time while maintaining
                other professional commitments.
              </p>
            </div>

            <div className="faq-item">
              <h4>What subjects are in demand?</h4>
              <p>
                Mathematics, Sciences, Computer Science, and English are
                currently in high demand.
              </p>
            </div>

            <div className="faq-item">
              <h4>How do I get paid?</h4>
              <p>
                We process payments monthly via bank transfer, PayPal, or other
                local payment methods.
              </p>
            </div>

            <div className="faq-item">
              <h4>Is there training provided?</h4>
              <p>
                Yes, we provide comprehensive onboarding and ongoing
                professional development opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="teacher-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Your Teaching Journey?</h2>
            <p>
              Join hundreds of expert educators already making a difference on
              Trespics
            </p>
            <div className="cta-buttons">
              <Link to="/auth/register" className="btn btn-primary btn-lg">
                Become a Teacher Today
                <span className="btn-icon">→</span>
              </Link>
              <Link to="/contact" className="btn btn-outline-light btn-lg">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default TeacherHome;
